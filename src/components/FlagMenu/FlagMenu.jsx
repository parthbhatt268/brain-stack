import { useEffect, useRef } from 'react';
import './FlagMenu.css';

export default function FlagMenu({ flag, position, nodeCount, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  useEffect(() => {
    function handleKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const MENU_W = 180;
  const x = Math.min(position.x, window.innerWidth  - MENU_W - 12);
  const y = Math.min(position.y, window.innerHeight - 80  - 12);

  const { category, color } = flag.data;

  return (
    <div ref={ref} className="flag-menu" style={{ left: x, top: y }}>
      <div className="flag-menu__header">
        <span className="flag-menu__dot" style={{ background: color }} />
        <span className="flag-menu__category">{category}</span>
      </div>
      <p className="flag-menu__count">
        {nodeCount} {nodeCount === 1 ? 'node' : 'nodes'}
      </p>
    </div>
  );
}
