import { useState } from 'react';
import { Link2, Loader2 } from 'lucide-react';
import { analyseUrl } from '../../utils/fakeApi';
import './AddNodeModal.css';

export default function AddNodeModal({ onAdd, onClose }) {
  const [url, setUrl]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  async function handleSave() {
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Paste a link before saving.');
      return;
    }
    try { new URL(trimmed); } catch {
      setError("That doesn't look like a valid URL — make sure it starts with https://");
      return;
    }

    setError('');
    setLoading(true);
    try {
      const data = await analyseUrl(trimmed);
      onAdd({ url: trimmed, ...data });
      onClose();
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !loading) handleSave();
    if (e.key === 'Escape') onClose();
  }

  function handleOverlayMouseDown(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="add-modal-overlay" onMouseDown={handleOverlayMouseDown}>
      <div className="add-modal" role="dialog" aria-modal="true" aria-labelledby="add-modal-title" onKeyDown={handleKeyDown}>

        <div className="add-modal__header">
          <span className="add-modal__icon-wrap">
            <Link2 size={18} />
          </span>
          <div className="add-modal__header-text">
            <h2 className="add-modal__title" id="add-modal-title">
              Save a link to your Brain Stack
            </h2>
            <p className="add-modal__subtitle">
              Paste any URL — YouTube, GitHub, Reddit, articles, and more.
              We'll analyse it and place it in the right category on your graph automatically.
            </p>
          </div>
        </div>

        <div className="add-modal__body">
          <input
            type="url"
            className={`add-modal__input${error ? ' add-modal__input--error' : ''}`}
            placeholder="https://..."
            value={url}
            onChange={e => { setUrl(e.target.value); setError(''); }}
            autoFocus
            disabled={loading}
            spellCheck={false}
          />
          {error && <p className="add-modal__error">{error}</p>}
        </div>

        <div className="add-modal__footer">
          <button
            className="add-modal__btn add-modal__btn--cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="add-modal__btn add-modal__btn--save"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="add-modal__spinner" />
                Analysing…
              </>
            ) : (
              'Analyse & Add'
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
