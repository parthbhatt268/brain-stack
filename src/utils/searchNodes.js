import { apiFetch } from '../lib/apiClient';

/**
 * Ask the backend which node best answers the user's query.
 * Sends the query + optional category filter to POST /api/search,
 * which runs a pgvector cosine-similarity search and returns the
 * closest matching node ID.
 *
 * @param {string}   query          - natural-language question
 * @param {object[]} nodes          - current ReactFlow nodes (used to resolve nodeId → node object)
 * @param {string}   categoryFilter - 'all' or a category name
 * @returns {Promise<object|null>}  best-matching ReactFlow node, or null if no match
 */
export async function searchNodes(query, nodes, categoryFilter = 'all') {
  const res = await apiFetch('/api/search', {
    method: 'POST',
    body: JSON.stringify({ query, categoryFilter }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Search request failed');
  }

  const { nodeId } = await res.json();

  if (!nodeId) return null;

  return nodes.find(n => n.id === nodeId && n.type === 'brainNode') ?? null;
}
