import { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ThemeProvider } from './context/ThemeContext';
import { demoNodes } from './data/demoData';
import { buildGraph } from './utils/buildGraph';
import BrainNode from './components/BrainNode/BrainNode';
import Toolbar from './components/Toolbar/Toolbar';
import Ribbon from './components/Ribbon/Ribbon';
import './App.css';

const nodeTypes = { brainNode: BrainNode };

function Flow() {
  const initialGraph = useMemo(() => buildGraph(demoNodes), []);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialGraph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialGraph.edges);
  const [clipboard, setClipboard] = useState([]);
  const [mode, setMode] = useState('pan'); // 'pan' | 'select'
  const { zoomIn, zoomOut } = useReactFlow();

  const selectedNodes = useMemo(
    () => nodes.filter(n => n.selected),
    [nodes],
  );
  const hasSelection = selectedNodes.length > 0;

  const handleSelectAll = useCallback(() => {
    setNodes(nds => nds.map(n => ({ ...n, selected: true })));
  }, [setNodes]);

  const handleDelete = useCallback(() => {
    const selectedIds = new Set(nodes.filter(n => n.selected).map(n => n.id));
    setClipboard(nodes.filter(n => n.selected));
    setNodes(nds => nds.filter(n => !selectedIds.has(n.id)));
    setEdges(eds =>
      eds.filter(e => !selectedIds.has(e.source) && !selectedIds.has(e.target)),
    );
  }, [nodes, setNodes, setEdges]);

  const handlePaste = useCallback(() => {
    if (!clipboard.length) return;
    const offset = 80;
    const pasted = clipboard.map(n => ({
      ...n,
      id: `${n.id}-copy-${Date.now()}`,
      position: { x: n.position.x + offset, y: n.position.y + offset },
      selected: false,
    }));
    setNodes(nds => [...nds, ...pasted]);
  }, [clipboard, setNodes]);

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
      />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.4 }}
        panOnDrag={isPan}
        selectionOnDrag={!isPan}
        selectNodesOnDrag={!isPan}
        selectionMode="partial"
        minZoom={0.2}
        maxZoom={4}
        defaultEdgeOptions={{ type: 'smoothstep' }}
        className={isPan ? 'flow--pan-mode' : 'flow--select-mode'}
      >
        <Background gap={28} size={1} color="var(--dot-color)" />
      </ReactFlow>
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
