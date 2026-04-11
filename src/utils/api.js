import { supabase } from '../lib/supabaseClient';

/**
 * Classify a URL by calling the /analyse Edge Function.
 * Returns { category, subcategory, summary, origin }.
 */
export async function analyseUrl(url) {
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyse`,
    {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ url }),
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'URL analysis failed');
  }

  return res.json(); // { category, subcategory, summary, origin }
}
