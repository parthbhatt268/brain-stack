import { ZoomIn, ZoomOut, MousePointerClick, Scissors, ClipboardPaste, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './Toolbar.css';

export default function Toolbar({ hasSelection, onZoomIn, onZoomOut, onSelectAll, onDelete, onPaste }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="toolbar">
      <div className="toolbar__group">
        <button className="toolbar__btn" onClick={onZoomIn} title="Zoom in">
          <ZoomIn size={18} />
        </button>
        <button className="toolbar__btn" onClick={onZoomOut} title="Zoom out">
          <ZoomOut size={18} />
        </button>
      </div>

      <div className="toolbar__divider" />

      <div className="toolbar__group">
        <button className="toolbar__btn" onClick={onSelectAll} title="Select all">
          <MousePointerClick size={18} />
        </button>
      </div>

      {hasSelection && (
        <>
          <div className="toolbar__divider" />
          <div className="toolbar__group toolbar__group--contextual">
            <button className="toolbar__btn toolbar__btn--danger" onClick={onDelete} title="Delete selected">
              <Scissors size={18} />
            </button>
            <button className="toolbar__btn" onClick={onPaste} title="Paste">
              <ClipboardPaste size={18} />
            </button>
          </div>
        </>
      )}

      <div className="toolbar__spacer" />

      <button className="toolbar__btn" onClick={toggleTheme} title="Toggle theme">
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>
    </div>
  );
}
