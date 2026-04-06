import { Handle, Position } from '@xyflow/react';
import './FlagNode.css';

function FilledFlag({ color, size = 44 }) {
  return (
    <svg width={size} height={Math.round(size * 1.2)} viewBox="0 0 44 52" fill="none">
      {/* Pole */}
      <line
        x1="10" y1="4" x2="10" y2="50"
        stroke={color} strokeWidth="3.5" strokeLinecap="round"
      />
      {/* Filled flag */}
      <path d="M10 4 L40 14 L10 26 Z" fill={color} />
    </svg>
  );
}

export default function FlagNode({ data }) {
  const { category, color } = data;

  return (
    <div className="flag-node">
      <FilledFlag color={color} />
      <span className="flag-node__label" style={{ color }}>
        {category}
      </span>
      <Handle
        type="source"
        position={Position.Bottom}
        className="flag-node__handle"
      />
    </div>
  );
}
