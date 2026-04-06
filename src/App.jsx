import { useState, useCallback, useMemo } from 'react';
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
import SaveBar from './components/SaveBar/SaveBar';
import NodeModal from './components/NodeModal/NodeModal';
import FlagMenu from './components/FlagMenu/FlagMenu';
import AddNodeModal from './components/AddNodeModal/AddNodeModal';
import './App.css';

const nodeTypes = { brainNode: BrainNode, flagNode: FlagNode };

// Categories that have subcategory data and can visually split
const SPLITTABLE_CATEGORIES = new Set(
  demoNodes.filter(n => n.subcategory != null).map(n => n.category),
);

function Flow() {
  // Split mode: when ON, categories with subcategories branch into lanes
  const [isSplitMode, setIsSplitMode] = useState(true); // AI starts split

  const splitCategories = useMemo(
    () => (isSplitMode ? SPLITTABLE_CATEGORIES : new Set()),
    [isSplitMode],
  );

  const initialGraph = useMemo(
    () => buildGraph(demoNodes, isSplitMode ? SPLITTABLE_CATEGORIES : new Set()),
    [], // only runs once — toggle rebuild handled via handleToggleSplitMode
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialGraph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialGraph.edges);
  const [clipboard, setClipboard]         = useState([]);
  const [mode, setMode]                   = useState('pan');
  const [isDirty, setIsDirty]             = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState({
    nodes: initialGraph.nodes,
    edges: initialGraph.edges,
  });

  const [past, setPast]     = useState([]);
  const [future, setFuture] = useState([]);
  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const [activeNode, setActiveNode]   = useState(null);
  const [flagMenu, setFlagMenu]       = useState(null); // { flag, position }
  const [showAddModal, setShowAddModal] = useState(false);

  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const selectedNodes = useMemo(() => nodes.filter(n => n.selected), [nodes]);
  const hasSelection  = selectedNodes.length > 0;

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
  }, [past, nodes, edges, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (!future.length) return;
    const next = future[0];
    setPast(p => [...p, { nodes, edges }]);
    setFuture(f => f.slice(1));
    setNodes(next.nodes);
    setEdges(next.edges);
  }, [future, nodes, edges, setNodes, setEdges]);

  // ── View toggle — Default ↔ Split ─────────────────────────────────────────
  const handleToggleSplitMode = useCallback(() => {
    pushHistory(nodes, edges);
    const nextMode = !isSplitMode;
    const nextSplit = nextMode ? SPLITTABLE_CATEGORIES : new Set();
    const { nodes: newNodes, edges: newEdges } = buildGraph(demoNodes, nextSplit);
    setIsSplitMode(nextMode);
    setNodes(newNodes);
    setEdges(newEdges);
    setIsDirty(true);
  }, [isSplitMode, nodes, edges, pushHistory, setNodes, setEdges]);

  // ── Edge connection — category inheritance ────────────────────────────────
  const onConnect = useCallback((connection) => {
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);
    if (!sourceNode || !targetNode) return;

    const parentCategory = sourceNode.data?.category || targetNode.data?.category;
    const parentColor    = parentCategory ? getCategoryColor(parentCategory) : undefined;
    const edgeStyle      = parentColor ? { stroke: parentColor, strokeWidth: 2 } : undefined;

    if (!parentCategory) {
      setEdges(eds => addEdge({ ...connection, type: 'smoothstep' }, eds));
      return;
    }

    pushHistory(nodes, edges);

    const updatedNodes = nodes.map(n =>
      n.id === connection.target && n.type === 'brainNode' && n.data.category !== parentCategory
        ? { ...n, data: { ...n.data, category: parentCategory, color: parentColor } }
        : n,
    );

    setNodes(updatedNodes);
    setEdges(eds => addEdge({ ...connection, type: 'smoothstep', style: edgeStyle }, eds));
    setIsDirty(true);
  }, [nodes, edges, pushHistory, setNodes, setEdges]);

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
    setIsDirty(true);
  }, [nodes, edges, pushHistory, setNodes, setEdges]);

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
    setIsDirty(true);
  }, [clipboard, nodes, edges, pushHistory, setNodes]);

  // ── Save / Discard ────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    setSavedSnapshot({ nodes, edges });
    setIsDirty(false);
  }, [nodes, edges]);

  const handleDiscard = useCallback(() => {
    pushHistory(nodes, edges);
    setNodes(savedSnapshot.nodes);
    setEdges(savedSnapshot.edges);
    setIsDirty(false);
  }, [nodes, edges, savedSnapshot, pushHistory, setNodes, setEdges]);

  // ── Add node via URL ──────────────────────────────────────────────────────
  const handleAddNode = useCallback(({ url, category, subcategory, source, summary, origin }) => {
    pushHistory(nodes, edges);

    const color = getCategoryColor(category);

    // Find the last node in the target lane so we can chain below it
    const laneNodes = nodes.filter(n => {
      if (n.type !== 'brainNode' || n.data.category !== category) return false;
      if (isSplitMode && subcategory) return n.data.subcategory === subcategory;
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

    const sourceId = lastNode ? lastNode.id : `flag-${category}`;
    const newEdge = {
      id: `edge-${sourceId}-${newId}`,
      source: sourceId,
      target: newId,
      type: 'default',
      style: { stroke: color, strokeWidth: 2 },
    };

    setNodes(nds => [...nds, newNode]);
    setEdges(eds => [...eds, newEdge]);
    setIsDirty(true);
  }, [nodes, edges, isSplitMode, pushHistory, setNodes, setEdges]);

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
      <Ribbon isSplitMode={isSplitMode} onToggleSplitMode={handleToggleSplitMode} />
      <Toolbar
        mode={mode}
        onModeChange={setMode}
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

      <SaveBar isDirty={isDirty} onSave={handleSave} onDiscard={handleDiscard} />

      {/* Add-node FAB — lifts above SaveBar when SaveBar is visible */}
      <button
        className={`add-node-fab${isDirty ? ' add-node-fab--lifted' : ''}`}
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
