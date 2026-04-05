import { useEffect, useRef } from 'react';
import './CategoryPicker.css';

export default function CategoryPicker({ node, categories, position, onSelect, onClose }) {
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  // Clamp position so popup stays inside the viewport
  const POPUP_W = 220;
  const POPUP_H = 220;
  const x = Math.min(position.x, window.innerWidth - POPUP_W - 12);
  const y = Math.min(position.y, window.innerHeight - POPUP_H - 12);

  const currentCategory = node.data.category;

  return (
    <div
      ref={ref}
      className="category-picker"
      style={{ left: x, top: y }}
    >
      <p className="category-picker__label">Change category</p>
      <ul className="category-picker__list">
        {categories.map(({ name, color }) => (
          <li key={name}>
            <button
              className={`category-picker__option ${name === currentCategory ? 'category-picker__option--current' : ''}`}
              onClick={() => {
                if (name !== currentCategory) onSelect(node.id, name);
                else onClose();
              }}
            >
              <span className="category-picker__swatch" style={{ background: color }} />
              <span className="category-picker__name">{name}</span>
              {name === currentCategory && (
                <span className="category-picker__current-tag">current</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
