import { ZoomIn, ZoomOut, MousePointerClick, Hand, Scissors, ClipboardPaste } from 'lucide-react';
import './Toolbar.css';

export default function Toolbar({
  mode,
  onModeChange,
  hasSelection,
  onZoomIn,
  onZoomOut,
  onSelectAll,
  onDelete,
  onPaste,
}) {
  return (
    <div className="toolbar">
      {/* Pan / Select toggle */}
      <div className="toolbar__group">
        <button
          className={`toolbar__btn ${mode === 'pan' ? 'toolbar__btn--active' : ''}`}
          onClick={() => onModeChange('pan')}
          title="Pan — drag to move canvas"
        >
          <Hand size={18} />
        </button>
        <button
          className={`toolbar__btn ${mode === 'select' ? 'toolbar__btn--active' : ''}`}
          onClick={() => onModeChange('select')}
          title="Select — drag to select nodes"
        >
          <MousePointerClick size={18} />
        </button>
      </div>

      <div className="toolbar__divider" />

      {/* Zoom */}
      <div className="toolbar__group">
        <button className="toolbar__btn" onClick={onZoomIn} title="Zoom in">
          <ZoomIn size={18} />
        </button>
        <button className="toolbar__btn" onClick={onZoomOut} title="Zoom out">
          <ZoomOut size={18} />
        </button>
      </div>

      <div className="toolbar__divider" />

      {/* Cut & Paste — always visible, disabled when nothing is selected */}
      <div className="toolbar__group">
        <button
          className={`toolbar__btn toolbar__btn--danger ${!hasSelection ? 'toolbar__btn--disabled' : ''}`}
          onClick={hasSelection ? onDelete : undefined}
          title={hasSelection ? 'Cut selected nodes' : 'Select a node first'}
          aria-disabled={!hasSelection}
        >
          <Scissors size={18} />
        </button>
        <button
          className={`toolbar__btn ${!hasSelection ? 'toolbar__btn--disabled' : ''}`}
          onClick={hasSelection ? onPaste : undefined}
          title={hasSelection ? 'Paste nodes' : 'Select a node first'}
          aria-disabled={!hasSelection}
        >
          <ClipboardPaste size={18} />
        </button>
      </div>

      <div className="toolbar__divider" />

      {/* Select all */}
      <div className="toolbar__group">
        <button
          className="toolbar__btn toolbar__btn--small-label"
          onClick={onSelectAll}
          title="Select all nodes"
        >
          <MousePointerClick size={14} />
          <span>All</span>
        </button>
      </div>
    </div>
  );
}
