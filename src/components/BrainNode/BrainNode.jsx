import { Handle, Position } from '@xyflow/react';
import SourceIcon from '../SourceIcon/SourceIcon';
import './BrainNode.css';

export default function BrainNode({ data, selected }) {
  const { source, color, summary, category } = data;

  return (
    <div
      className={`brain-node ${selected ? 'brain-node--selected' : ''}`}
      style={{
        borderColor: color,
        boxShadow: selected
          ? `0 0 0 3px ${color}44, 0 4px 12px rgba(0,0,0,0.15)`
          : `0 2px 8px rgba(0,0,0,0.1)`,
      }}
    >
      <Handle type="target" position={Position.Top} className="brain-node__handle" />
      <div className="brain-node__icon" style={{ color }}>
        <SourceIcon source={source} />
      </div>
      <div className="brain-node__badge" style={{ backgroundColor: color }}>
        {category}
      </div>
      <Handle type="source" position={Position.Bottom} className="brain-node__handle" />

      <div className="brain-node__tooltip">
        <p className="brain-node__summary">{summary}</p>
      </div>
    </div>
  );
}
