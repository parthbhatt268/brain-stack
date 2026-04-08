import { Handle, Position } from '@xyflow/react';
import { Tag } from 'lucide-react';
import './SubCategoryNode.css';

/**
 * Split a label into at most two lines.
 * Labels of 3 words or fewer stay on a single line.
 * Longer labels are cut at the midpoint word.
 */
function splitLabel(label) {
  const words = label.trim().split(/\s+/);
  if (words.length <= 3) return { line1: label, line2: null };
  const cut = Math.ceil(words.length / 2);
  return {
    line1: words.slice(0, cut).join(' '),
    line2: words.slice(cut).join(' '),
  };
}

export default function SubCategoryNode({ data }) {
  const { label, color } = data;
  const { line1, line2 } = splitLabel(label);

  return (
    <div className="subcategory-node" style={{ borderColor: color, color }}>
      <Handle
        type="target"
        position={Position.Top}
        className="subcategory-node__handle"
      />
      <Tag size={9} strokeWidth={2.5} />
      <span className="subcategory-node__label">
        {line1}
        {line2 && <><br />{line2}</>}
      </span>
      <Handle
        type="source"
        position={Position.Bottom}
        className="subcategory-node__handle"
      />
    </div>
  );
}
