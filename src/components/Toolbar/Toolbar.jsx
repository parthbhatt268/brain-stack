import { useState, useEffect, useRef } from 'react';
import {
  ZoomIn, ZoomOut, Maximize2,
  Scissors, ClipboardPaste,
  Undo2, Redo2,
  Clock, Layers, LayoutGrid,
  SlidersHorizontal, ChevronLeft,
} from 'lucide-react';
import './Toolbar.css';

// ── View mode definitions ─────────────────────────────────────────────────────
const VIEW_MODES = [
  {
    id: 'timeline',
    icon: Clock,
    label: 'Timeline',
    description: 'One chain per category, ordered by date',
  },
  {
    id: 'subcategory',
    icon: Layers,
    label: 'Group by Topic',
    description: 'Split each category into topic branches',
  },
  {
    id: 'platform',
    icon: LayoutGrid,
    label: 'Group by Platform',
    description: 'Split by source — YouTube, GitHub, etc.',
  },
];

// ── Generic toolbar button ────────────────────────────────────────────────────
function ToolBtn({ icon: Icon, onClick, active, disabled, danger, small, label, title }) {
  return (
    <button
      className={[
        'toolbar__btn',
        active    ? 'toolbar__btn--active'      : '',
        disabled  ? 'toolbar__btn--disabled'    : '',
        danger    ? 'toolbar__btn--danger'      : '',
        small     ? 'toolbar__btn--small-label' : '',
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

// ── View picker (opens to the right of the toolbar) ───────────────────────────
function ViewPicker({ viewMode, onViewModeChange, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleMouseDown(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    function handleKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  return (
    <div ref={ref} className="view-picker">
      <p className="view-picker__label">Layout</p>
      {VIEW_MODES.map(({ id, icon: Icon, label, description }) => (
        <button
          key={id}
          className={`view-picker__option${viewMode === id ? ' view-picker__option--active' : ''}`}
          onClick={() => { onViewModeChange(id); onClose(); }}
        >
          <span className="view-picker__option-icon">
            <Icon size={15} />
          </span>
          <span className="view-picker__option-text">
            <span className="view-picker__option-name">{label}</span>
            <span className="view-picker__option-desc">{description}</span>
          </span>
          {viewMode === id && <span className="view-picker__check">✓</span>}
        </button>
      ))}
    </div>
  );
}

// ── Main Toolbar ──────────────────────────────────────────────────────────────
export default function Toolbar({
  viewMode,
  onViewModeChange,
  hasSelection,
  hasClipboard,
  onZoomIn,
  onZoomOut,
  onFitView,
  onDelete,
  onPaste,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) {
  const [pickerOpen, setPickerOpen]     = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(true); // open by default on mobile

  const currentMode = VIEW_MODES.find(m => m.id === viewMode) ?? VIEW_MODES[0];
  const ViewIcon    = currentMode.icon;

  function handleTabClick(e) {
    e.stopPropagation();
    if (!isMobileOpen) {
      setIsMobileOpen(true);
    } else {
      setIsMobileOpen(false);
      setPickerOpen(false);
    }
  }

  function handleToolbarInteract() {} // no-op — kept for onClick wiring

  return (
    <div className={`toolbar${isMobileOpen ? ' toolbar--mobile-open' : ''}`}>
      {/* ── Mobile bookmark tab — always visible on mobile, hidden on desktop ── */}
      <button
        className={`toolbar__mobile-tab${isMobileOpen ? ' toolbar__mobile-tab--open' : ''}`}
        onClick={handleTabClick}
        title={isMobileOpen ? 'Close toolbar' : 'Open toolbar'}
        aria-label={isMobileOpen ? 'Close toolbar' : 'Open toolbar'}
      >
        {isMobileOpen ? <ChevronLeft size={15} /> : <SlidersHorizontal size={15} />}
      </button>

      {/* View mode picker */}
      <div className="toolbar__group" style={{ position: 'relative' }}>
        <button
          className={`toolbar__btn${pickerOpen ? ' toolbar__btn--active' : ''}`}
          onClick={() => setPickerOpen(o => !o)}
          title={`Layout: ${currentMode.label}`}
        >
          <ViewIcon size={18} />
        </button>
        {pickerOpen && (
          <ViewPicker
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            onClose={() => setPickerOpen(false)}
          />
        )}
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

      {/* Cut & Paste */}
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

    </div>
  );
}
