import { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ThemeProvider } from './context/ThemeContext';
import { demoNodes } from './data/demoData';
import { buildGraph, rebuildEdges } from './utils/buildGraph';
import { getCategoryColor } from './utils/categoryColors';
import BrainNode from './components/BrainNode/BrainNode';
import Toolbar from './components/Toolbar/Toolbar';
import Ribbon from './components/Ribbon/Ribbon';
import SaveBar from './components/SaveBar/SaveBar';
import NodeModal from './components/NodeModal/NodeModal';
import './App.css';

const nodeTypes = { brainNode: BrainNode };

function Flow() {
  const initialGraph = useMemo(() => buildGraph(demoNodes), []);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialGraph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialGraph.edges);
  const [clipboard, setClipboard] = useState([]);
  const [mode, setMode] = useState('pan');
  const [isDirty, setIsDirty] = useState(false);

  // Snapshot before changes so Discard can restore
  const [savedSnapshot, setSavedSnapshot] = useState({ nodes: initialGraph.nodes, edges: initialGraph.edges });

  // Undo / Redo history
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  // Node detail modal
  const [activeNode, setActiveNode] = useState(null);

  const { zoomIn, zoomOut } = useReactFlow();

  const selectedNodes = useMemo(() => nodes.filter(n => n.selected), [nodes]);
  const hasSelection = selectedNodes.length > 0;

  const availableCategories = useMemo(() => {
    const seen = new Map();
    for (const n of nodes) {
      if (!seen.has(n.data.category)) seen.set(n.data.category, n.data.color);
    }
    return Array.from(seen.entries()).map(([name, color]) => ({ name, color }));
  }, [nodes]);

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

  // ── Canvas actions ────────────────────────────────────────────────────────
  const handleSelectAll = useCallback(() => {
    setNodes(nds => nds.map(n => ({ ...n, selected: true })));
  }, [setNodes]);

  const handleDelete = useCallback(() => {
    pushHistory(nodes, edges);
    const selectedIds = new Set(nodes.filter(n => n.selected).map(n => n.id));
    setClipboard(nodes.filter(n => n.selected));
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

  const handleCategoryChange = useCallback((nodeId, newCategory) => {
    pushHistory(nodes, edges);
    const newColor = getCategoryColor(newCategory);
    const updatedNodes = nodes.map(n =>
      n.id === nodeId
        ? { ...n, data: { ...n.data, category: newCategory, color: newColor } }
        : n,
    );
    setNodes(updatedNodes);
    setEdges(rebuildEdges(updatedNodes));
    setIsDirty(true);
    // Update the active node so the modal reflects the change immediately
    setActiveNode(prev => prev && prev.id === nodeId
      ? { ...prev, data: { ...prev.data, category: newCategory, color: newColor } }
      : prev
    );
  }, [nodes, edges, pushHistory, setNodes, setEdges]);

  // ── Save / Discard ────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    setSavedSnapshot({ nodes, edges });
    setIsDirty(false);
    // TODO: persist to backend
  }, [nodes, edges]);

  const handleDiscard = useCallback(() => {
    pushHistory(nodes, edges);
    setNodes(savedSnapshot.nodes);
    setEdges(savedSnapshot.edges);
    setIsDirty(false);
  }, [nodes, edges, savedSnapshot, pushHistory, setNodes, setEdges]);

  // ── Node click → open modal ───────────────────────────────────────────────
  const handleNodeClick = useCallback((_event, node) => {
    setActiveNode(node);
  }, []);

  const isPan = mode === 'pan';

  return (
    <div className="flow-wrapper">
      <Ribbon />
      <Toolbar
        mode={mode}
        onModeChange={setMode}
        hasSelection={hasSelection}
        onZoomIn={() => zoomIn({ duration: 350 })}
        onZoomOut={() => zoomOut({ duration: 350 })}
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
        defaultEdgeOptions={{ type: 'smoothstep' }}
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

      {activeNode && (
        <NodeModal
          node={activeNode}
          categories={availableCategories}
          onCategoryChange={handleCategoryChange}
          onClose={() => setActiveNode(null)}
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
