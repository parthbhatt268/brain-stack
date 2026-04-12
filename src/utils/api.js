import { supabase } from '../lib/supabaseClient';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

/**
 * Fire-and-forget GET /health to wake a cold Render.com instance before the
 * user tries to add a link. Errors are intentionally swallowed.
 */
export function warmUpServer() {
  fetch(`${API_BASE}/health`).catch(() => {});
}

/**
 * Classify a URL by calling the Express backend /api/analyse endpoint.
 * Returns { category, subcategory, summary, origin, source }.
 * source is now detected server-side — no need for detectSource() on the frontend.
 */
export async function analyseUrl(url) {
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch(`${API_BASE}/api/analyse`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ url }),
  });

  if (res.status === 401) {
    await supabase.auth.signOut(); // clears session → sign-in modal appears
    throw new Error('Session expired — please sign in again.');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'URL analysis failed');
  }

  return res.json(); // { category, subcategory, summary, origin, source }
}
