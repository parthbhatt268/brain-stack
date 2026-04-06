import { ZoomIn, ZoomOut, MousePointerClick, Hand, Scissors, ClipboardPaste, Undo2, Redo2, Maximize2 } from 'lucide-react';
import './Toolbar.css';

function ToolBtn({ icon: Icon, onClick, active, disabled, danger, small, label, title }) {
  return (
    <button
      className={[
        'toolbar__btn',
        active ? 'toolbar__btn--active' : '',
        disabled ? 'toolbar__btn--disabled' : '',
        danger ? 'toolbar__btn--danger' : '',
        small ? 'toolbar__btn--small-label' : '',
      ].filter(Boolean).join(' ')}
      onClick={disabled ? undefined : onClick}
      title={title}
      aria-disabled={disabled}
    >
      <Icon size={small ? 14 : 18} />
      {label && <span>{label}</span>}
    </button>
  );
}

export default function Toolbar({
  mode,
  onModeChange,
  hasSelection,
  hasClipboard,
  onZoomIn,
  onZoomOut,
  onFitView,
  onSelectAll,
  onDelete,
  onPaste,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) {
  return (
    <div className="toolbar">
      {/* Pan / Select toggle */}
      <div className="toolbar__group">
        <ToolBtn icon={Hand} active={mode === 'pan'} onClick={() => onModeChange('pan')} title="Pan — drag to move canvas" />
        <ToolBtn icon={MousePointerClick} active={mode === 'select'} onClick={() => onModeChange('select')} title="Select — drag to select nodes" />
      </div>

      <div className="toolbar__divider" />

      {/* Zoom */}
      <div className="toolbar__group">
        <ToolBtn icon={ZoomIn} onClick={onZoomIn} title="Zoom in" />
        <ToolBtn icon={ZoomOut} onClick={onZoomOut} title="Zoom out" />
        <ToolBtn icon={Maximize2} onClick={onFitView} title="Fit all nodes to screen" />
      </div>

      <div className="toolbar__divider" />

      {/* Undo / Redo */}
      <div className="toolbar__group">
        <ToolBtn icon={Undo2} onClick={onUndo} disabled={!canUndo} title={canUndo ? 'Undo' : 'Nothing to undo'} />
        <ToolBtn icon={Redo2} onClick={onRedo} disabled={!canRedo} title={canRedo ? 'Redo' : 'Nothing to redo'} />
      </div>

      <div className="toolbar__divider" />

      {/* Cut & Paste — always visible, disabled when nothing selected */}
      <div className="toolbar__group">
        <ToolBtn
          icon={Scissors}
          onClick={onDelete}
          disabled={!hasSelection}
          danger
          title={hasSelection ? 'Cut selected nodes' : 'Select a node first'}
        />
        <ToolBtn
          icon={ClipboardPaste}
          onClick={onPaste}
          disabled={!hasClipboard}
          title={hasClipboard ? 'Paste nodes' : 'Cut something first'}
        />
      </div>

      <div className="toolbar__divider" />

      {/* Select all */}
      <div className="toolbar__group">
        <ToolBtn icon={MousePointerClick} onClick={onSelectAll} small label="All" title="Select all nodes" />
      </div>
    </div>
  );
}
