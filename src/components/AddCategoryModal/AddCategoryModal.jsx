import { useState } from 'react';
import { Flag } from 'lucide-react';
import { COLOR_POOL, getUsedColors } from '../../utils/categoryColors';
import './AddCategoryModal.css';

// Inline flag preview — mirrors FlagNode's SVG
function FlagPreview({ color }) {
  return (
    <svg width={32} height={38} viewBox="0 0 44 52" fill="none">
      <line x1="10" y1="4" x2="10" y2="50" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M10 4 L40 14 L10 26 Z" fill={color} />
    </svg>
  );
}

export default function AddCategoryModal({ existingCategories, onAdd, onClose }) {
  const usedColors  = getUsedColors();
  const firstFree   = COLOR_POOL.find(c => !usedColors.has(c)) ?? COLOR_POOL[0];

  const [name, setName]       = useState('');
  const [color, setColor]     = useState(firstFree);
  const [error, setError]     = useState('');

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Category name is required.');
      return;
    }
    if (existingCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      setError(`"${trimmed}" already exists.`);
      return;
    }
    onAdd({ name: trimmed, color });
    onClose();
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onClose();
  }

  function handleOverlayMouseDown(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="add-modal-overlay" onMouseDown={handleOverlayMouseDown}>
      <div
        className="add-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-cat-title"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="add-modal__header">
          <span className="add-modal__icon-wrap">
            <Flag size={18} />
          </span>
          <h2 className="add-modal__title" id="add-cat-title">
            Create a category
          </h2>
        </div>

        {/* Body */}
        <div className="add-modal__body">
          <input
            type="text"
            className={`add-modal__input${error ? ' add-modal__input--error' : ''}`}
            placeholder="Category name…"
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            autoFocus
            spellCheck={false}
            maxLength={32}
          />
          {error && <p className="add-modal__error">{error}</p>}

          {/* Color picker */}
          <div className="cat-modal__color-section">
            <span className="cat-modal__color-label">Colour</span>
            <div className="cat-modal__swatches">
              {COLOR_POOL.map(hex => {
                const taken    = usedColors.has(hex) && hex !== color;
                const selected = hex === color;
                return (
                  <button
                    key={hex}
                    type="button"
                    className={[
                      'cat-modal__swatch',
                      selected ? 'cat-modal__swatch--selected' : '',
                      taken    ? 'cat-modal__swatch--taken'    : '',
                    ].filter(Boolean).join(' ')}
                    style={{ '--swatch-color': hex }}
                    onClick={() => !taken && setColor(hex)}
                    title={taken ? 'Already in use' : hex}
                    aria-pressed={selected}
                  />
                );
              })}
            </div>

            {/* Live flag preview */}
            <div className="cat-modal__preview">
              <FlagPreview color={color} />
              <span className="cat-modal__preview-label" style={{ color }}>
                {name.trim() || 'Preview'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="add-modal__footer">
          <button className="add-modal__btn add-modal__btn--cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="add-modal__btn add-modal__btn--save" onClick={handleSave}>
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
