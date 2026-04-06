import { Handle, Position } from '@xyflow/react';
import SourceIcon from '../SourceIcon/SourceIcon';
import './BrainNode.css';

export default function BrainNode({ data, selected }) {
  const { source, color, category, highlighted } = data;

  return (
    <div
      className={[
        'brain-node',
        selected    ? 'brain-node--selected'    : '',
        highlighted ? 'brain-node--highlighted' : '',
      ].filter(Boolean).join(' ')}
      style={{ borderColor: color, '--node-color': color }}
    >
      <Handle type="target" position={Position.Top} className="brain-node__handle" />

      <div className="brain-node__icon">
        <SourceIcon source={source} />
      </div>

      <div className="brain-node__badge" style={{ backgroundColor: color }}>
        {category}
      </div>

      <Handle type="source" position={Position.Bottom} className="brain-node__handle" />
    </div>
  );
}
