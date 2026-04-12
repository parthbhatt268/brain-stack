import { useState } from 'react';
import { Loader } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import './SignInModal.css';

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function SignInModal() {
  const { signInWithGoogle } = useAuth();
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError]             = useState('');

  async function handleDemoLogin() {
    const email    = import.meta.env.VITE_DEMO_EMAIL;
    const password = import.meta.env.VITE_DEMO_PASSWORD;
    if (!email || !password) {
      setError('Demo credentials not configured.');
      return;
    }
    setDemoLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      setDemoLoading(false);
    }
  }

  return (
    <div className="signin-backdrop">
      <div className="signin-modal" role="dialog" aria-modal="true" aria-label="Sign in">

        <img src="/brain-stack.ico" alt="Brain Stack" className="signin-modal__icon" />

        <div className="signin-modal__brand">
          <span className="signin-modal__name">Brain Stack</span>
          <span className="signin-modal__tagline">Your personal knowledge graph</span>
        </div>

        <div className="signin-modal__divider" />

        <button
          className="signin-modal__btn signin-modal__btn--primary"
          onClick={handleDemoLogin}
          disabled={demoLoading}
        >
          {demoLoading
            ? <Loader size={14} className="signin-modal__spinner" />
            : 'Demo login for Hackathon'
          }
        </button>

        <button
          className="signin-modal__btn signin-modal__btn--ghost"
          onClick={signInWithGoogle}
          disabled={demoLoading}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        {error && <p className="signin-modal__error">{error}</p>}

      </div>
    </div>
  );
}
