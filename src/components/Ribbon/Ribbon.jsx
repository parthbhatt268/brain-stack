import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, User } from 'lucide-react';
import './Ribbon.css';

export default function Ribbon() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="ribbon">
      <div className="ribbon__left">
        <span className="ribbon__logo">Brain Stack</span>
      </div>

      <div className="ribbon__right">
        <label className="theme-switch" title="Toggle theme">
          <input
            type="checkbox"
            checked={theme === 'dark'}
            onChange={toggleTheme}
            className="theme-switch__input"
          />
          <span className="theme-switch__track">
            <span className="theme-switch__icon theme-switch__icon--sun">
              <Sun size={13} />
            </span>
            <span className="theme-switch__icon theme-switch__icon--moon">
              <Moon size={13} />
            </span>
            <span className="theme-switch__thumb" />
          </span>
        </label>

        <button className="ribbon__avatar" title="Profile">
          <User size={18} />
        </button>
      </div>
    </header>
  );
}
