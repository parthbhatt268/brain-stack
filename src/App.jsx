import { useState, useCallback, useMemo, useRef } from 'react';
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

import { Plus } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { demoNodes } from './data/demoData';
import { buildGraph } from './utils/buildGraph';
import { getCategoryColor } from './utils/categoryColors';
import BrainNode from './components/BrainNode/BrainNode';
import FlagNode from './components/FlagNode/FlagNode';
import Toolbar from './components/Toolbar/Toolbar';
import Ribbon from './components/Ribbon/Ribbon';
import NodeModal from './components/NodeModal/NodeModal';
import FlagMenu from './components/FlagMenu/FlagMenu';
import AddNodeModal from './components/AddNodeModal/AddNodeModal';
import './App.css';

const nodeTypes = { brainNode: BrainNode, flagNode: FlagNode };

function Flow() {
  // View mode drives the graph layout
  const [viewMode, setViewMode] = useState('subcategory');

  const initialGraph = useMemo(
    () => buildGraph(demoNodes, 'subcategory'),
    [], // built once; subsequent changes are driven by handleSetViewMode
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialGraph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialGraph.edges);
  const [clipboard, setClipboard] = useState([]);
  const [mode, setMode]           = useState('pan');

  const [past, setPast]     = useState([]);
  const [future, setFuture] = useState([]);
  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const [activeNode, setActiveNode]     = useState(null);
  const [flagMenu, setFlagMenu]         = useState(null); // { flag, position, nodeCount }
  const [showAddModal, setShowAddModal] = useState(false);

  // Auto-save indicator — shown briefly after each intentional change
  const [savedVisible, setSavedVisible] = useState(false);
  const savedTimerRef = useRef(null);

  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const selectedNodes = useMemo(() => nodes.filter(n => n.selected), [nodes]);
  const hasSelection  = selectedNodes.length > 0;

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
    const { nodes: newNodes, edges: newEdges } = buildGraph(demoNodes, newMode);
    setViewMode(newMode);
    setNodes(newNodes);
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
  const handleSelectAll = useCallback(() => {
    setNodes(nds => nds.map(n =>
      n.type === 'flagNode' ? n : { ...n, selected: true },
    ));
  }, [setNodes]);

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

  // ── Add node via URL ──────────────────────────────────────────────────────
  const handleAddNode = useCallback(({ url, category, subcategory, source, summary, origin }) => {
    pushHistory(nodes, edges);

    const color = getCategoryColor(category);

    // Find the last node in the target lane to chain after it
    const laneNodes = nodes.filter(n => {
      if (n.type !== 'brainNode' || n.data.category !== category) return false;
      if (viewMode === 'subcategory' && subcategory) return n.data.subcategory === subcategory;
      if (viewMode === 'platform'    && source)      return n.data.source      === source;
      return true;
    });

    const lastNode = laneNodes.reduce(
      (latest, n) => (!latest || n.position.y > latest.position.y ? n : latest),
      null,
    );

    const newX  = lastNode?.position.x ?? 0;
    const newY  = lastNode ? lastNode.position.y + 120 : 0;
    const newId = `node-added-${Date.now()}`;

    const newNode = {
      id: newId,
      type: 'brainNode',
      position: { x: newX, y: newY },
      data: {
        id: newId,
        category,
        subcategory: subcategory ?? null,
        source,
        url,
        summary,
        datetime: new Date().toISOString(),
        origin,
        color,
      },
    };

    const edgeSourceId = lastNode ? lastNode.id : `flag-${category}`;
    const newEdge = {
      id: `edge-${edgeSourceId}-${newId}`,
      source: edgeSourceId,
      target: newId,
      type: 'default',
      style: { stroke: color, strokeWidth: 2 },
    };

    setNodes(nds => [...nds, newNode]);
    setEdges(eds => [...eds, newEdge]);
    triggerAutoSave();
  }, [nodes, edges, viewMode, pushHistory, setNodes, setEdges, triggerAutoSave]);

  // ── Node / flag clicks ────────────────────────────────────────────────────
  const handleNodeClick = useCallback((event, node) => {
    if (node.type === 'flagNode') {
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
    setActiveNode(node);
  }, [nodes]);

  const isPan = mode === 'pan';

  return (
    <div className="flow-wrapper">
      <Ribbon savedVisible={savedVisible} />
      <Toolbar
        mode={mode}
        onModeChange={setMode}
        viewMode={viewMode}
        onViewModeChange={handleSetViewMode}
        hasSelection={hasSelection}
        hasClipboard={clipboard.length > 0}
        onZoomIn={() => zoomIn({ duration: 350 })}
        onZoomOut={() => zoomOut({ duration: 350 })}
        onFitView={() => fitView({ duration: 500, padding: 0.4 })}
        onSelectAll={handleSelectAll}
        onDelete={handleDelete}
        onPaste={handlePaste}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
      />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.4 }}
        panOnDrag={isPan}
        selectionOnDrag={!isPan}
        selectNodesOnDrag={!isPan}
        selectionMode="partial"
        minZoom={0.2}
        maxZoom={4}
        deleteKeyCode="Delete"
        defaultEdgeOptions={{ type: 'default' }}
        className={[
          isPan ? 'flow--pan-mode' : 'flow--select-mode',
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

      <button
        className="add-node-fab"
        onClick={() => setShowAddModal(true)}
        title="Add a link to your Brain Stack"
        aria-label="Add a link to your Brain Stack"
      >
        <Plus size={24} />
      </button>

      {showAddModal && (
        <AddNodeModal
          onAdd={handleAddNode}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {activeNode && (
        <NodeModal node={activeNode} onClose={() => setActiveNode(null)} />
      )}

      {flagMenu && (
        <FlagMenu
          flag={flagMenu.flag}
          position={flagMenu.position}
          nodeCount={flagMenu.nodeCount}
          onClose={() => setFlagMenu(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ReactFlowProvider>
        <Flow />
      </ReactFlowProvider>
    </ThemeProvider>
  );
}
