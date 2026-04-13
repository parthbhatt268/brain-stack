import { supabase } from './supabaseClient';

const BASE_URL = (import.meta.env.VITE_API_URL as string) ?? 'https://api-brain-stack.onrender.com';

/**
 * Thin fetch wrapper that attaches the Supabase session JWT as a Bearer token
 * to every request. Falls back gracefully when there is no active session.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> ?? {}),
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return fetch(`${BASE_URL}${path}`, { ...init, headers });
}
