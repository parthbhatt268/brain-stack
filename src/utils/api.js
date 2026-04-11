import { supabase } from '../lib/supabaseClient';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

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

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'URL analysis failed');
  }

  return res.json(); // { category, subcategory, summary, origin, source }
}
