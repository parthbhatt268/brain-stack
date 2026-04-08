/**
 * STUB — Node search via backend LLM.
 *
 * Real implementation: POST /api/search with the query + candidate node
 * summaries. The backend stuffs them into an LLM prompt and returns the
 * matching node ID (or null). No algorithm lives here.
 * See assumptions.md §4 for the full migration path.
 */

/**
 * Ask the backend which node best answers the user's question.
 *
 * @param {string}   query          - natural-language question
 * @param {object[]} nodes          - current ReactFlow nodes
 * @param {string}   categoryFilter - 'all' or a category name
 * @returns {Promise<object|null>}  best-matching ReactFlow node, or null
 */
export async function searchNodes(query, nodes, categoryFilter = 'all') {
  const candidates = nodes.filter(n => {
    if (n.type !== 'brainNode') return false;
    if (categoryFilter !== 'all' && n.data.category !== categoryFilter) return false;
    return true;
  });

  if (!candidates.length) return null;

  // Payload the real endpoint will receive:
  //   query   — the user's question
  //   nodes   — stripped-down node records the LLM uses as context
  //
  // When the backend has its own DB, replace `nodes` with
  //   nodeIds: candidates.map(n => n.id)
  // and let the backend load full records itself.
  const payload = {
    query,
    nodes: candidates.map(n => ({
      id:          n.id,
      summary:     n.data.summary,
      url:         n.data.url,
      category:    n.data.category,
      subcategory: n.data.subcategory ?? null,
    })),
  };

  // ── STUB ──────────────────────────────────────────────────────────────────
  // Replace the block below with a real fetch once the backend is ready:
  //
  //   const res = await fetch('/api/search', {
  //     method:  'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body:    JSON.stringify(payload),
  //   });
  //   if (!res.ok) throw new Error('Search request failed');
  //   const { nodeId } = await res.json();
  //   return nodeId ? (candidates.find(n => n.id === nodeId) ?? null) : null;
  // ─────────────────────────────────────────────────────────────────────────

  void payload; // prevent "unused variable" lint warning on the stub

  await new Promise(r => setTimeout(r, 900)); // simulate network latency

  // HARDCODED: always returns the first candidate so the highlight + zoom UI
  // can be verified without a real backend.
  return candidates[0] ?? null;
}
