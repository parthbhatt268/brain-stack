import { useEffect, useRef } from 'react';
import { X, ExternalLink } from 'lucide-react';
import SourceIcon from '../SourceIcon/SourceIcon';
import './NodeModal.css';

const ORIGIN_LABELS = {
  shared: { label: 'Shared', className: 'origin--shared' },
  added: { label: 'Added by you', className: 'origin--added' },
  suggested: { label: 'Suggested', className: 'origin--suggested' },
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export default function NodeModal({ node, categories, onCategoryChange, onClose }) {
  const backdropRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const { source, color, category, summary, url, datetime, origin } = node.data;
  const originMeta = ORIGIN_LABELS[origin] || ORIGIN_LABELS.added;

  function handleBackdropClick(e) {
    if (e.target === backdropRef.current) onClose();
  }

  return (
    <div className="modal-backdrop" ref={backdropRef} onClick={handleBackdropClick}>
      <div className="modal" role="dialog" aria-modal="true">

        {/* Header */}
        <div className="modal__header" style={{ borderColor: color }}>
          <div className="modal__header-icon" style={{ color }}>
            <SourceIcon source={source} />
          </div>
          <div className="modal__header-meta">
            <span className="modal__source-label">{source}</span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="modal__url"
            >
              {url.replace(/^https?:\/\//, '')}
              <ExternalLink size={11} />
            </a>
          </div>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal__body">

          {/* Summary */}
          <section className="modal__section">
            <h3 className="modal__section-title">Summary</h3>
            <p className="modal__summary">{summary}</p>
          </section>

          {/* Category selector */}
          <section className="modal__section">
            <h3 className="modal__section-title">Category</h3>
            <div className="modal__categories">
              {categories.map(({ name, color: catColor }) => (
                <button
                  key={name}
                  className={`modal__cat-btn ${name === category ? 'modal__cat-btn--active' : ''}`}
                  style={{
                    '--cat-color': catColor,
                    borderColor: name === category ? catColor : 'transparent',
                    boxShadow: name === category ? `0 0 0 3px ${catColor}30` : 'none',
                  }}
                  onClick={() => {
                    if (name !== category) onCategoryChange(node.id, name);
                  }}
                >
                  <span className="modal__cat-swatch" style={{ background: catColor }} />
                  <span>{name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Meta row */}
          <section className="modal__section modal__section--meta">
            <span className={`modal__origin-badge ${originMeta.className}`}>
              {originMeta.label}
            </span>
            <span className="modal__date">{formatDate(datetime)}</span>
          </section>
        </div>
      </div>
    </div>
  );
}
