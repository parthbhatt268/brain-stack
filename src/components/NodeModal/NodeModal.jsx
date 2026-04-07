import { useEffect, useRef } from 'react';
import { X, ExternalLink, Trash2 } from 'lucide-react';
import SourceIcon from '../SourceIcon/SourceIcon';
import './NodeModal.css';

const ORIGIN_LABELS = {
  shared:    { label: 'Shared',        className: 'origin--shared' },
  added:     { label: 'Added by you',  className: 'origin--added' },
  suggested: { label: 'Suggested',     className: 'origin--suggested' },
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export default function NodeModal({ node, onClose, onDelete }) {
  const backdropRef = useRef(null);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const { source, color, category, summary, url, datetime, origin } = node.data;
  const originMeta = ORIGIN_LABELS[origin] || ORIGIN_LABELS.added;

  return (
    <div
      className="modal-backdrop"
      ref={backdropRef}
      onClick={e => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="modal" role="dialog" aria-modal="true">

        {/* Header */}
        <div className="modal__header">
          <div className="modal__header-icon">
            <SourceIcon source={source} />
          </div>
          <div className="modal__header-meta">
            <span className="modal__source-label">{source}</span>
            <a href={url} target="_blank" rel="noopener noreferrer" className="modal__url">
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

          {/* Category label (read-only) */}
          <div className="modal__category-row">
            <span className="modal__cat-dot" style={{ background: color }} />
            <span className="modal__cat-name">{category}</span>
          </div>

          {/* Summary */}
          <section className="modal__section">
            <h3 className="modal__section-title">Summary</h3>
            <p className="modal__summary">{summary}</p>
          </section>

          {/* Meta */}
          <section className="modal__section modal__section--meta">
            <span className={`modal__origin-badge ${originMeta.className}`}>
              {originMeta.label}
            </span>
            <span className="modal__date">{formatDate(datetime)}</span>
          </section>
        </div>

        {/* Footer */}
        <div className="modal__footer">
          <button className="modal__delete-btn" onClick={() => onDelete(node.id)}>
            <Trash2 size={15} />
            Delete node
          </button>
        </div>
      </div>
    </div>
  );
}
