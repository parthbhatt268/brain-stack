import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Plus, X, Link2, Flag } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NodeInteractionContext } from './context/NodeInteractionContext';
import { supabase } from './lib/supabaseClient';
import { buildGraph } from './utils/buildGraph';
import { getCategoryColor } from './utils/categoryColors';
import BrainNode from './components/BrainNode/BrainNode';
import FlagNode from './components/FlagNode/FlagNode';
import SubCategoryNode from './components/SubCategoryNode/SubCategoryNode';
import { detectSource } from './components/SourceIcon/SourceIcon';
import Toolbar from './components/Toolbar/Toolbar';
import Ribbon from './components/Ribbon/Ribbon';
import NodeModal from './components/NodeModal/NodeModal';
import FlagMenu from './components/FlagMenu/FlagMenu';
import AddNodeModal from './components/AddNodeModal/AddNodeModal';
import AddCategoryModal from './components/AddCategoryModal/AddCategoryModal';
import SearchBar from './components/SearchBar/SearchBar';
import SignInModal from './components/SignInModal/SignInModal';
import { searchNodes } from './utils/searchNodes';
import { setCategoryColor } from './utils/categoryColors';
import './App.css';

const nodeTypes = { brainNode: BrainNode, flagNode: FlagNode, subCategoryNode: SubCategoryNode };

// ── Position persistence (localStorage) ──────────────────────────────────────
const POSITIONS_KEY = 'brain-stack-positions';

function loadSavedPositions(viewMode) {
  try {
    const all = JSON.parse(localStorage.getItem(POSITIONS_KEY) || '{}');
    return all[viewMode] || {};
  } catch {
    return {};
  }
}

function savePositionsForMode(viewMode, nodes) {
  try {
    const all = JSON.parse(localStorage.getItem(POSITIONS_KEY) || '{}');
    all[viewMode] = {};
    for (const node of nodes) {
      all[viewMode][node.id] = node.position;
    }
    localStorage.setItem(POSITIONS_KEY, JSON.stringify(all));
  } catch {
    // localStorage unavailable (private browsing, quota exceeded) — silently skip
  }
}

function applyPositions(nodes, savedPositions) {
  if (!Object.keys(savedPositions).length) return nodes;
  return nodes.map(n => savedPositions[n.id] ? { ...n, position: savedPositions[n.id] } : n);
}

/**
 * Remove brain nodes by ID, then prune any subcategory or flag nodes that are
 * now empty — mirrors what buildGraph would produce on a fresh load.
 */
function removeNodesWithCleanup(allNodes, allEdges, nodeIds) {
  const idSet = new Set(nodeIds);
  const deletedBrainNodes = allNodes.filter(n => idSet.has(n.id) && n.type === 'brainNode');

  let newNodes = allNodes.filter(n => !idSet.has(n.id));
  let newEdges = allEdges.filter(e => !idSet.has(e.source) && !idSet.has(e.target));

  for (const deleted of deletedBrainNodes) {
    const { category, subcategory } = deleted.data;
    const branchLabel = subcategory || 'General';

    // Prune subcategory node if its branch is now empty
    const branchStillHasNodes = newNodes.some(
      n => n.type === 'brainNode'
        && n.data.category === category
        && (n.data.subcategory || 'General') === branchLabel,
    );
    if (!branchStillHasNodes) {
      const subCatId = `subcategory-${category}-${branchLabel}`;
      newNodes = newNodes.filter(n => n.id !== subCatId);
      newEdges = newEdges.filter(e => e.source !== subCatId && e.target !== subCatId);
    }

    // Prune flag node if the whole category is now empty
    const catStillHasNodes = newNodes.some(
      n => n.type === 'brainNode' && n.data.category === category,
    );
    if (!catStillHasNodes) {
      const flagId = `flag-${category}`;
      newNodes = newNodes.filter(n => n.id !== flagId);
      newEdges = newEdges.filter(e => e.source !== flagId && e.target !== flagId);
    }
  }

  return { nodes: newNodes, edges: newEdges };
}

function Flow() {
  // View mode drives the graph layout
  const [viewMode, setViewMode] = useState('subcategory');

  // Tracks which data nodes are currently in use (demo or user-loaded).
  // A ref keeps it out of the render cycle — buildGraph is called explicitly.
  const dataNodesRef = useRef([]);

  // Tracks user-created categories that have no data nodes yet.
  // Stored separately (not in dataNodesRef) so they persist across view-mode rebuilds.
  // Populated from the backend's /graph response (data.categories) and updated
  // locally when the user adds a new category or adds the first node to one.
  const userCategoriesRef = useRef([]);

  const { user, loading } = useAuth();

  const initialGraph = useMemo(() => ({ nodes: [], edges: [] }), []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialGraph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialGraph.edges);
  const [clipboard, setClipboard] = useState([]);

  const [past, setPast]     = useState([]);
  const [future, setFuture] = useState([]);
  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const [activeNode, setActiveNode]     = useState(null);
  const [flagMenu, setFlagMenu]         = useState(null); // { flag, position, nodeCount }
  const [showAddModal, setShowAddModal]         = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [fabOpen, setFabOpen]                     = useState(false);

  // Auto-save indicator — shown briefly after each intentional change
  const [savedVisible, setSavedVisible] = useState(false);
  const savedTimerRef = useRef(null);

  const { zoomIn, zoomOut, fitView, setCenter } = useReactFlow();

  // Auto-fit after view mode changes (skip the initial mount)
  const hasMounted = useRef(false);
  useEffect(() => {
    if (!hasMounted.current) { hasMounted.current = true; return; }
    fitView({ duration: 600, padding: 0.4 });
  }, [viewMode]); // fitView is stable — intentionally omitted from deps

  // When auth state changes:
  //   - user signs out → clear to blank canvas
  //   - user signs in  → load their graph from DB
  useEffect(() => {
    if (!user) {
      dataNodesRef.current = [];
      userCategoriesRef.current = [];
      setNodes([]);
      setEdges([]);
      return;
    }

    (async () => {
      const [
        { data: nodeData, error: nodeErr },
        { data: catData },
        { data: posRows },
      ] = await Promise.all([
        supabase.from('nodes').select('*'),
        supabase.from('categories').select('name, color'),
        supabase.from('graph_positions').select('view_mode, positions'),
      ]);

      if (nodeErr) console.error('Nodes fetch failed:', nodeErr.message);

      const dbNodes  = nodeData ?? [];
      const cats     = catData  ?? [];
      const dbPosMap = Object.fromEntries((posRows ?? []).map(r => [r.view_mode, r.positions]));

      dataNodesRef.current      = dbNodes;
      userCategoriesRef.current = cats;

      const { nodes: newNodes, edges: newEdges } = buildGraph(dbNodes, viewMode, cats);
      const posForMode = dbPosMap[viewMode] ?? loadSavedPositions(viewMode);
      setNodes(applyPositions(newNodes, posForMode));
      setEdges(newEdges);

      // fitView after the initial prop already fired on an empty canvas —
      // give ReactFlow one frame to render the newly set nodes first.
      if (newNodes.length) setTimeout(() => fitView({ duration: 400, padding: 0.4 }), 50);
    })().catch(err => console.error('Graph load failed:', err));
  // viewMode and fitView intentionally excluded — viewMode: we only reload on auth change,
  // not on every mode switch. fitView: stable ref from useReactFlow, never changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const hasSelection     = useMemo(() => nodes.some(n => n.selected), [nodes]);
  const selectedBrainNode = useMemo(
    () => nodes.find(n => n.selected && n.type === 'brainNode') ?? null,
    [nodes],
  );

  // ── Search state ──────────────────────────────────────────────────────────
  const [highlightedNodeId, setHighlightedNodeId] = useState(null);
  const [searchNotFound, setSearchNotFound]       = useState(false);
  const [searchError, setSearchError]             = useState(false);
  const [isSearching, setIsSearching]             = useState(false);
  const highlightTimerRef = useRef(null);
  const notFoundTimerRef  = useRef(null);

  // Unique categories for the SearchBar filter dropdown
  // All category names — includes flag-only categories with no brain nodes yet
  const categories = useMemo(
    () => [...new Set(nodes.filter(n => n.data?.category).map(n => n.data.category))],
    [nodes],
  );

  // Display nodes — adds transient `highlighted` flag without mutating nodes state
  const displayNodes = useMemo(
    () => highlightedNodeId
      ? nodes.map(n => n.id === highlightedNodeId
          ? { ...n, data: { ...n.data, highlighted: true } }
          : n)
      : nodes,
    [nodes, highlightedNodeId],
  );

  // ── Auto-save trigger ─────────────────────────────────────────────────────
  // Called explicitly from each intentional action (not on every node drag).
  const triggerAutoSave = useCallback(() => {
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    setSavedVisible(true);
    savedTimerRef.current = setTimeout(() => setSavedVisible(false), 2500);
  }, []);

  // ── History ───────────────────────────────────────────────────────────────
  const pushHistory = useCallback((currentNodes, currentEdges) => {
    setPast(p => [...p, { nodes: currentNodes, edges: currentEdges }]);
    setFuture([]);
  }, []);

  const undo = useCallback(() => {
    if (!past.length) return;
    const prev = past[past.length - 1];
    setFuture(f => [{ nodes, edges }, ...f]);
    setPast(p => p.slice(0, -1));
    setNodes(prev.nodes);
    setEdges(prev.edges);
    triggerAutoSave();
  }, [past, nodes, edges, setNodes, setEdges, triggerAutoSave]);

  const redo = useCallback(() => {
    if (!future.length) return;
    const next = future[0];
    setPast(p => [...p, { nodes, edges }]);
    setFuture(f => f.slice(1));
    setNodes(next.nodes);
    setEdges(next.edges);
    triggerAutoSave();
  }, [future, nodes, edges, setNodes, setEdges, triggerAutoSave]);

  // ── View mode change ──────────────────────────────────────────────────────
  const handleSetViewMode = useCallback((newMode) => {
    if (newMode === viewMode) return;
    pushHistory(nodes, edges);
    const { nodes: newNodes, edges: newEdges } = buildGraph(dataNodesRef.current, newMode, userCategoriesRef.current);
    setViewMode(newMode);
    setNodes(applyPositions(newNodes, loadSavedPositions(newMode)));
    setEdges(newEdges);
    triggerAutoSave();
  }, [viewMode, nodes, edges, pushHistory, setNodes, setEdges, triggerAutoSave]);

  // ── Edge connection — category inheritance ────────────────────────────────
  const onConnect = useCallback((connection) => {
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);
    if (!sourceNode || !targetNode) return;

    const parentCategory = sourceNode.data?.category || targetNode.data?.category;
    const parentColor    = parentCategory ? getCategoryColor(parentCategory) : undefined;
    const edgeStyle      = parentColor ? { stroke: parentColor, strokeWidth: 2 } : undefined;

    if (!parentCategory) {
      setEdges(eds => addEdge({ ...connection, type: 'default' }, eds));
      return;
    }

    pushHistory(nodes, edges);

    const updatedNodes = nodes.map(n =>
      n.id === connection.target && n.type === 'brainNode' && n.data.category !== parentCategory
        ? { ...n, data: { ...n.data, category: parentCategory, color: parentColor } }
        : n,
    );

    setNodes(updatedNodes);
    setEdges(eds => addEdge({ ...connection, type: 'default', style: edgeStyle }, eds));
    triggerAutoSave();
  }, [nodes, edges, pushHistory, setNodes, setEdges, triggerAutoSave]);

  // ── Canvas actions ────────────────────────────────────────────────────────
  const handleDelete = useCallback(() => {
    pushHistory(nodes, edges);
    const selectedIds = new Set(nodes.filter(n => n.selected).map(n => n.id));
    setClipboard(nodes.filter(n => n.selected && n.type === 'brainNode'));
    setNodes(nds => nds.filter(n => !selectedIds.has(n.id)));
    setEdges(eds =>
      eds.filter(e => !selectedIds.has(e.source) && !selectedIds.has(e.target)),
    );
    triggerAutoSave();
  }, [nodes, edges, pushHistory, setNodes, setEdges, triggerAutoSave]);

  const handlePaste = useCallback(() => {
    if (!clipboard.length) return;
    pushHistory(nodes, edges);
    const pasted = clipboard.map(n => ({
      ...n,
      id: `${n.id}-copy-${Date.now()}`,
      position: { x: n.position.x + 80, y: n.position.y + 80 },
      selected: false,
    }));
    setNodes(nds => [...nds, ...pasted]);
    triggerAutoSave();
  }, [clipboard, nodes, edges, pushHistory, setNodes, triggerAutoSave]);

  // ── Delete selected brain nodes (keyboard Delete or toolbar Trash) ───────
  // Persists to DB — fixes the bug where keyboard Delete skipped the DB call.
  const handleDeleteSelected = useCallback(() => {
    const selected = nodes.filter(n => n.selected && n.type === 'brainNode');
    if (!selected.length) return;

    pushHistory(nodes, edges);
    const selectedIds = new Set(selected.map(n => n.id));

    const { nodes: newNodes, edges: newEdges } = removeNodesWithCleanup(nodes, edges, [...selectedIds]);
    setNodes(newNodes);
    setEdges(newEdges);

    // Keep dataNodesRef in sync so view-mode rebuilds don't resurface deleted nodes
    dataNodesRef.current = dataNodesRef.current.filter(n => !selectedIds.has(n.id));

    if (user) {
      selected.forEach(n => {
        supabase.from('nodes').delete().eq('id', n.id)
          .then(({ error }) => { if (error) console.error('Node delete failed', error.message); });
      });
    }

    triggerAutoSave();
  }, [nodes, edges, user, pushHistory, setNodes, setEdges, triggerAutoSave]);

  // ── Open info modal for the currently selected brain node ─────────────────
  const handleInfoSelected = useCallback(() => {
    const node = nodes.find(n => n.selected && n.type === 'brainNode');
    if (node) setActiveNode(node);
  }, [nodes]);

  // ── Keyboard Delete — replaces ReactFlow's deleteKeyCode handling ─────────
  // ReactFlow's built-in deleteKeyCode fires onNodesChange internally and never
  // reaches handleDeleteNode, so the DB deletion was silently skipped.
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key !== 'Delete') return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;
      if (showAddModal || showCategoryModal || activeNode) return;
      handleDeleteSelected();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [handleDeleteSelected, showAddModal, showCategoryModal, activeNode]);

  // ── Delete single node from modal ────────────────────────────────────────
  const handleDeleteNode = useCallback((nodeId) => {
    pushHistory(nodes, edges);

    const { nodes: newNodes, edges: newEdges } = removeNodesWithCleanup(nodes, edges, [nodeId]);
    setNodes(newNodes);
    setEdges(newEdges);
    setActiveNode(null);

    // Keep dataNodesRef in sync so view-mode rebuilds don't resurface deleted nodes
    dataNodesRef.current = dataNodesRef.current.filter(n => n.id !== nodeId);

    if (user) {
      supabase.from('nodes').delete().eq('id', nodeId)
        .then(({ error }) => { if (error) console.error('Node delete failed', error.message); });
    }

    triggerAutoSave();
  }, [nodes, edges, user, pushHistory, setNodes, setEdges, triggerAutoSave]);

  // ── Add node via URL ──────────────────────────────────────────────────────
  const handleAddNode = useCallback(({ url, category, subcategory, summary, origin, source }) => {
    pushHistory(nodes, edges);

    const color    = getCategoryColor(category);
    const newId    = `node-added-${Date.now()}`;
    const datetime = new Date().toISOString();

    const newDataNode = {
      id:          newId,
      category,
      subcategory: subcategory ?? null,
      source,
      url,
      summary,
      datetime,
      origin,
    };

    // Keep dataNodesRef in sync so subsequent view-mode rebuilds include this node
    dataNodesRef.current = [...dataNodesRef.current, newDataNode];

    // If this category was flag-only (no data nodes yet), remove it from the extras list
    userCategoriesRef.current = userCategoriesRef.current.filter(c => c.name !== category);

    if (user) {
      supabase.from('nodes').insert({
        id:          newId,
        user_id:     user.id,
        category,
        subcategory: subcategory ?? null,
        source,
        url,
        summary,
        datetime,
        origin,
      }).then(({ error }) => { if (error) console.error('Node save failed', error.message); });
    }

    // Find the last node already in the target lane
    const laneNodes = nodes.filter(n => {
      if (n.type !== 'brainNode' || n.data.category !== category) return false;
      if (viewMode === 'subcategory' && subcategory) return n.data.subcategory === subcategory;
      if (viewMode === 'platform') return detectSource(n.data.url) === source;
      return true;
    });

    const lastNode = laneNodes.reduce(
      (latest, n) => (!latest || n.position.y > latest.position.y ? n : latest),
      null,
    );

    if (!lastNode) {
      // First node in this lane — new category or new subcategory/platform branch.
      // Let buildGraph create the flag + subcategory structural nodes correctly
      // rather than manually wiring edges to nodes that don't exist yet.
      const { nodes: newNodes, edges: newEdges } = buildGraph(
        dataNodesRef.current, viewMode, userCategoriesRef.current,
      );
      setNodes(applyPositions(newNodes, loadSavedPositions(viewMode)));
      setEdges(newEdges);
    } else {
      // Appending to an existing lane — manual splice is cheaper than a full rebuild
      const newNode = {
        id: newId,
        type: 'brainNode',
        position: { x: lastNode.position.x, y: lastNode.position.y + 120 },
        data: { ...newDataNode, color },
      };
      const newEdge = {
        id:     `edge-${lastNode.id}-${newId}`,
        source: lastNode.id,
        target: newId,
        type:   'default',
        style:  { stroke: color, strokeWidth: 2 },
      };
      setNodes(nds => [...nds, newNode]);
      setEdges(eds => [...eds, newEdge]);
    }

    triggerAutoSave();
  }, [nodes, edges, viewMode, user, pushHistory, setNodes, setEdges, triggerAutoSave]);

  // ── Add category (flag-only, no nodes yet) ───────────────────────────────
  const handleAddCategory = useCallback(({ name, color }) => {
    pushHistory(nodes, edges);
    setCategoryColor(name, color);

    // Track this empty category so it survives view-mode rebuilds
    userCategoriesRef.current = [...userCategoriesRef.current, { name, color }];

    // Rebuild the full graph so buildGraph controls flag positioning consistently
    const { nodes: newNodes, edges: newEdges } = buildGraph(
      dataNodesRef.current, viewMode, userCategoriesRef.current,
    );
    setNodes(applyPositions(newNodes, loadSavedPositions(viewMode)));
    setEdges(newEdges);

    if (user) {
      supabase.from('categories').insert({ user_id: user.id, name, color })
        .then(({ error }) => { if (error) console.error('Category save failed', error.message); });
    }

    triggerAutoSave();
  }, [nodes, edges, viewMode, user, pushHistory, setNodes, setEdges, triggerAutoSave]);

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearch = useCallback(async (query, categoryFilter) => {
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    if (notFoundTimerRef.current)  clearTimeout(notFoundTimerRef.current);
    setHighlightedNodeId(null);
    setSearchNotFound(false);
    setSearchError(false);
    setIsSearching(true);

    try {
      const result = await searchNodes(query, nodes, categoryFilter);

      if (!result) {
        setSearchNotFound(true);
        notFoundTimerRef.current = setTimeout(() => setSearchNotFound(false), 3500);
        return;
      }

      setHighlightedNodeId(result.id);
      // Pan + zoom to the matched node (BrainNode is 64×64 px, centre offset = 32)
      setCenter(result.position.x + 32, result.position.y + 32, { zoom: 2, duration: 650 });
      // Auto-clear highlight after 5 seconds
      highlightTimerRef.current = setTimeout(() => setHighlightedNodeId(null), 5000);
    } catch {
      setSearchError(true);
      notFoundTimerRef.current = setTimeout(() => setSearchError(false), 3500);
    } finally {
      setIsSearching(false);
    }
  }, [nodes, setCenter]);

  const handleClearSearch = useCallback(() => {
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    if (notFoundTimerRef.current)  clearTimeout(notFoundTimerRef.current);
    setHighlightedNodeId(null);
    setSearchNotFound(false);
    setSearchError(false);
  }, []);

  // ── Node drag stop — persist positions ───────────────────────────────────
  const handleNodeDragStop = useCallback((_event, _node, allNodes) => {
    savePositionsForMode(viewMode, allNodes); // localStorage (offline fallback)

    if (user) {
      const positionMap = Object.fromEntries(allNodes.map(n => [n.id, n.position]));
      supabase.from('graph_positions').upsert(
        { user_id: user.id, view_mode: viewMode, positions: positionMap, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,view_mode' },
      ).then(({ error }) => { if (error) console.error('Position save failed', error.message); });
    }

    triggerAutoSave();
  }, [viewMode, user, triggerAutoSave]);

  // ── Node / flag clicks ────────────────────────────────────────────────────
  // Single click: select node (ReactFlow default) + open menu for flag/subCategory nodes.
  // brainNode: single click = select only, no modal.
  const handleNodeClick = useCallback((event, node) => {
    if (node.type === 'flagNode') {
      if (flagMenu?.flag.id === node.id) { setFlagMenu(null); return; }
      const nodeCount = nodes.filter(
        n => n.type === 'brainNode' && n.data.category === node.data.category,
      ).length;
      setFlagMenu({
        flag: node,
        position: { x: event.clientX + 12, y: event.clientY + 12 },
        nodeCount,
      });
      return;
    }
    if (node.type === 'subCategoryNode') {
      if (flagMenu?.flag.id === node.id) { setFlagMenu(null); return; }
      const { category, label } = node.data;
      const nodeCount = nodes.filter(
        n => n.type === 'brainNode' &&
             n.data.category === category &&
             (n.data.subcategory || 'General') === label,
      ).length;
      setFlagMenu({
        flag: node,
        position: { x: event.clientX + 12, y: event.clientY + 12 },
        nodeCount,
      });
      return;
    }
    // brainNode: do nothing here — modal opens on double-click (desktop)
    // or long-press (mobile) via handleNodeDoubleClick / handleLongPress.
  }, [nodes, flagMenu]);

  // Desktop: double-click on a brainNode opens its detail modal.
  const handleNodeDoubleClick = useCallback((_event, node) => {
    if (node.type === 'brainNode') setActiveNode(node);
  }, []);

  // Mobile: long-press on a brainNode (fired from BrainNode via context).
  const handleLongPress = useCallback((nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) setActiveNode(node);
  }, [nodes]);

  return (
    <NodeInteractionContext.Provider value={handleLongPress}>
    <div className="flow-wrapper">
      <Ribbon savedVisible={savedVisible} />
      <Toolbar
        viewMode={viewMode}
        onViewModeChange={handleSetViewMode}
        hasSelection={hasSelection}
        hasClipboard={clipboard.length > 0}
        onZoomIn={() => zoomIn({ duration: 350 })}
        onZoomOut={() => zoomOut({ duration: 350 })}
        onFitView={() => fitView({ duration: 500, padding: 0.4 })}
        onDelete={handleDelete}
        onPaste={handlePaste}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        selectedNode={selectedBrainNode}
        onDeleteSelected={handleDeleteSelected}
        onInfo={handleInfoSelected}
      />
      <ReactFlow
        nodes={displayNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onNodeDragStop={handleNodeDragStop}
        fitView
        fitViewOptions={{ padding: 0.4 }}
        panOnDrag
        minZoom={0.2}
        maxZoom={4}
        deleteKeyCode={null}
        defaultEdgeOptions={{ type: 'default' }}
        className={[
          'flow--pan-mode',
          hasSelection ? 'flow--has-selection' : '',
        ].join(' ')}
      >
        <Background
          variant={BackgroundVariant.Cross}
          gap={32}
          size={1.5}
          color="var(--dot-color)"
        />
      </ReactFlow>

      <SearchBar
        categories={categories}
        onSearch={handleSearch}
        onClear={handleClearSearch}
        notFound={searchNotFound}
        isSearching={isSearching}
        hasError={searchError}
      />

      {/* Dismiss overlay — closes speed dial when clicking outside */}
      {fabOpen && (
        <div className="fab-dismiss" onClick={() => setFabOpen(false)} aria-hidden="true" />
      )}

      {/* ── Speed-dial FAB ── */}
      <div className={`fab-wrap${fabOpen ? ' fab-wrap--open' : ''}`}>
        {fabOpen && (
          <>
            <button
              className="fab-item"
              onClick={() => { setFabOpen(false); setShowCategoryModal(true); }}
            >
              <span className="fab-item__label">New category</span>
              <span className="fab-item__icon"><Flag size={18} /></span>
            </button>
            <button
              className="fab-item"
              onClick={() => { setFabOpen(false); setShowAddModal(true); }}
            >
              <span className="fab-item__label">Add link</span>
              <span className="fab-item__icon"><Link2 size={18} /></span>
            </button>
          </>
        )}
        <button
          className="add-node-fab"
          onClick={() => setFabOpen(o => !o)}
          title={fabOpen ? 'Close' : 'Add…'}
          aria-label={fabOpen ? 'Close menu' : 'Add link or category'}
          aria-expanded={fabOpen}
        >
          {fabOpen ? <X size={22} /> : <Plus size={24} />}
        </button>
      </div>

      {showAddModal && (
        <AddNodeModal
          onAdd={handleAddNode}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showCategoryModal && (
        <AddCategoryModal
          existingCategories={categories}
          onAdd={handleAddCategory}
          onClose={() => setShowCategoryModal(false)}
        />
      )}

      {activeNode && (
        <NodeModal
          node={activeNode}
          onClose={() => setActiveNode(null)}
          onDelete={handleDeleteNode}
        />
      )}

      {flagMenu && (
        <FlagMenu
          flag={flagMenu.flag}
          position={flagMenu.position}
          nodeCount={flagMenu.nodeCount}
          onClose={() => setFlagMenu(null)}
        />
      )}
      {!loading && !user && <SignInModal />}
    </div>
    </NodeInteractionContext.Provider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ReactFlowProvider>
          <Flow />
        </ReactFlowProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
