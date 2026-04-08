import { useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import SourceIcon from '../SourceIcon/SourceIcon';
import { useNodeInteraction } from '../../context/NodeInteractionContext';
import './BrainNode.css';

const LONG_PRESS_MS = 500;

export default function BrainNode({ id, data, selected }) {
  const { url, color, category, highlighted } = data;
  const onLongPress = useNodeInteraction();

  const timerRef  = useRef(null);
  const movedRef  = useRef(false);
  const firedRef  = useRef(false);

  function onTouchStart(e) {
    // Ignore multi-touch (pinch/zoom)
    if (e.touches.length > 1) return;
    movedRef.current = false;
    firedRef.current = false;
    timerRef.current = setTimeout(() => {
      if (!movedRef.current) {
        firedRef.current = true;
        onLongPress(id);
      }
    }, LONG_PRESS_MS);
  }

  function onTouchMove() {
    // Finger moved — user is panning, not long-pressing
    movedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  function onTouchEnd(e) {
    if (timerRef.current) clearTimeout(timerRef.current);
    // Prevent the synthetic click that follows touchend from
    // triggering ReactFlow's onNodeClick after a long press.
    if (firedRef.current) e.preventDefault();
  }

  return (
    <div
      className={[
        'brain-node',
        selected    ? 'brain-node--selected'    : '',
        highlighted ? 'brain-node--highlighted' : '',
      ].filter(Boolean).join(' ')}
      style={{ borderColor: color, '--node-color': color }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <Handle type="target" position={Position.Top} className="brain-node__handle" />

      <div className="brain-node__icon">
        <SourceIcon url={url} />
      </div>

      <div className="brain-node__badge" style={{ backgroundColor: color }}>
        {category}
      </div>

      <Handle type="source" position={Position.Bottom} className="brain-node__handle" />
    </div>
  );
}
