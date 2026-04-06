# assumptions.md

Tracks every hard-coded value, stub, and deferred decision in the codebase.
Update this file whenever a stub is removed or a new one is added.

---

## 1. URL classification API — always returns AI / LLM & Prompting

**File:** `src/utils/fakeApi.js` → `analyseUrl(url)`

**What it does now:**
Simulates an 900 ms network delay, then unconditionally returns:
```js
{ category: 'ai', subcategory: 'LLM & Prompting', source: <detected>, summary: <placeholder>, origin: 'added' }
```

**What it should do:**
Call a real backend endpoint (e.g. `POST /api/analyse`) that:
- Fetches or scrapes the URL
- Uses an LLM or classifier to determine `category`, `subcategory`, and produce a ~50-word `summary`
- Returns the full node metadata shape

**How to remove the stub:**
Replace the body of `analyseUrl` with a `fetch('/api/analyse', { method: 'POST', body: JSON.stringify({ url }) })` call.
The response shape must match: `{ category, subcategory, source, summary, origin }`.

---

## 2. Split mode only supported for the `ai` category

**File:** `src/App.jsx` — `SPLITTABLE_CATEGORIES`

**What it does now:**
`SPLITTABLE_CATEGORIES` is derived at module load from `demoData` — any category that has at least one node with a non-null `subcategory`. Currently only `ai` nodes have subcategories, so only `ai` appears in the set.

Gardening and Guitar stub a `console.log('split triggered: …')` inside `buildGraph` but do nothing structurally — they have no subcategory data so no branching occurs.

**What it should do:**
Any category with meaningful subcategories should branch in split mode.
When the backend provides real data, the subcategory field should be populated, and the split will work automatically — no code change needed beyond having real data.

---

## 3. New nodes added via FAB use surgical append, not full graph rebuild

**File:** `src/App.jsx` → `handleAddNode`

**What it does now:**
When a URL is analysed and a node is added, it finds the last node in the target category lane (lowest Y) and appends the new node 120 px below it, connecting them with an edge. The rest of the graph is untouched.

**Limitation:**
If the classified `category` does not yet exist in the current graph (no flag node, no lane), the new node falls back to `x: 0, y: 0` with an edge sourced from `flag-<category>` which may not exist. This will produce a disconnected edge.

**How to fix when ready:**
If `laneNodes` is empty and the category is new, call `buildGraph` on the full updated dataset (including the new node) and push the result to `setNodes`/`setEdges`. Or assign the next available lane X from `buildGraph`'s layout logic.

---

## 4. Demo data is static (no backend persistence)

**File:** `src/data/demoData.js`

**What it does now:**
17 hardcoded node records are loaded on startup. "Save" only snapshots state in React memory (`savedSnapshot`); nothing is written to a database. On page refresh, the graph resets to the original demo data.

**How to fix when ready:**
On mount, fetch nodes from the backend instead of importing `demoData`. On "Save", `POST` the current `nodes` and `edges` state to a persistence endpoint.

---

## 5. Source icon detection is client-side only

**File:** `src/utils/fakeApi.js` → `detectSource(url)`

**What it does now:**
Derives the `source` field (youtube / github / etc.) from the URL hostname using a hardcoded map.

**Limitation:**
Only the 7 listed domains are mapped. Anything else falls back to `'article'`.

**How to fix when ready:**
The classification backend can return a more accurate `source` field, or the domain map can be extended.
