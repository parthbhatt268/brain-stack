import { useState } from 'react';
import { Link2, Loader2 } from 'lucide-react';
import { analyseUrl } from '../../utils/api';
import { validateUrl } from '../../utils/validateUrl';
import './AddNodeModal.css';

export default function AddNodeModal({ onAdd, onClose }) {
  const [url, setUrl]         = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleSave() {
    const { ok, error: validationError } = validateUrl(url);
    if (!ok) {
      setError(validationError);
      return;
    }

    setError('');
    setLoading(true);
    try {
      const data = await analyseUrl(url.trim());
      onAdd({ url: url.trim(), ...data });
      onClose();
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.');
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
      <div
        className="add-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-modal-title"
        onKeyDown={handleKeyDown}
      >
        <div className="add-modal__header">
          <span className="add-modal__icon-wrap">
            <Link2 size={18} />
          </span>
          <h2 className="add-modal__title" id="add-modal-title">
            Save a link to your Brain Stack
          </h2>
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
