import { Save, Trash2 } from 'lucide-react';
import './SaveBar.css';

export default function SaveBar({ isDirty, onSave, onDiscard }) {
  return (
    <div className={`save-bar ${isDirty ? 'save-bar--visible' : ''}`} aria-hidden={!isDirty}>
      <button className="save-bar__btn save-bar__btn--discard" onClick={onDiscard} tabIndex={isDirty ? 0 : -1}>
        <Trash2 size={14} />
        <span>Discard</span>
      </button>
      <button className="save-bar__btn save-bar__btn--save" onClick={onSave} tabIndex={isDirty ? 0 : -1}>
        <Save size={14} />
        <span>Save changes</span>
      </button>
    </div>
  );
}
