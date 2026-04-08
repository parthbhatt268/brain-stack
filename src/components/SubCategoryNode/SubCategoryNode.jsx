import { Handle, Position } from '@xyflow/react';
import { Tag } from 'lucide-react';
import './SubCategoryNode.css';

export default function SubCategoryNode({ data }) {
  const { label, color } = data;

  return (
    <div className="subcategory-node" style={{ borderColor: color, color }}>
      <Handle
        type="target"
        position={Position.Top}
        className="subcategory-node__handle"
      />
      <Tag size={11} strokeWidth={2.5} />
      <span className="subcategory-node__label">{label}</span>
      <Handle
        type="source"
        position={Position.Bottom}
        className="subcategory-node__handle"
      />
    </div>
  );
}
