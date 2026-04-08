import { useRef, useEffect, useState } from 'react';
import { Check, User } from 'lucide-react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import './Ribbon.css';

function AuthArea() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  if (!user) {
    return (
      <div className="ribbon__auth-buttons">
        <button
          className="ribbon__auth-btn"
          onClick={signInWithGoogle}
          title="Sign in with Google"
        >
          Sign In
        </button>
        <button
          className="ribbon__auth-btn ribbon__auth-btn--primary"
          onClick={signInWithGoogle}
          title="Create account with Google"
        >
          Sign Up
        </button>
      </div>
    );
  }

  const avatarUrl = user.user_metadata?.avatar_url;
  const displayName = user.user_metadata?.full_name ?? user.email ?? 'User';

  return (
    <div className="ribbon__avatar-wrap" ref={dropdownRef}>
      <button
        className="ribbon__avatar ribbon__avatar--photo"
        title={displayName}
        onClick={() => setDropdownOpen(o => !o)}
        aria-expanded={dropdownOpen}
      >
        {avatarUrl
          ? <img src={avatarUrl} alt={displayName} className="ribbon__avatar-img" referrerPolicy="no-referrer" />
          : <User size={18} />
        }
      </button>

      {dropdownOpen && (
        <div className="ribbon__dropdown">
          <span className="ribbon__dropdown-name">{displayName}</span>
          <button
            className="ribbon__dropdown-item"
            onClick={() => { setDropdownOpen(false); signOut(); }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Ribbon({ savedVisible }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="ribbon">
      <div className="ribbon__left">
        <span className="ribbon__logo">Brain Stack</span>
      </div>

      <div className="ribbon__right">
        {/* Auto-save indicator */}
        <span className={`ribbon__saved${savedVisible ? ' ribbon__saved--visible' : ''}`} aria-live="polite">
          <Check size={12} strokeWidth={2.5} />
          Saved
        </span>

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

        <AuthArea />
      </div>
    </header>
  );
}
