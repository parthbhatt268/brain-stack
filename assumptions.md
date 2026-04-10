# assumptions.md

Tracks every hard-coded value, stub, and deferred decision in the codebase.
Update this file whenever a stub is removed or a new one is added.

---

## Backend API Contract

> **For the backend developer.**
> Everything below describes what the frontend currently stubs out locally.
> Once you build these endpoints, remove the corresponding stub and uncomment
> the real `fetch(...)` call already written in each file.

### `POST /api/analyse`

Triggered when the user pastes a URL into the "Add a link" modal.
The frontend sends the URL; the backend scrapes/fetches it, classifies it,
and returns enriched metadata to create a new graph node.

**Request**

```json
{ "url": "https://example.com/some-article" }
```

**Response**

```json
{
  "category": "ai",
  "subcategory": "LLM & Prompting",
  "source": "youtube",
  "summary": "~50-word human-readable summary of the content",
  "origin": "added"
}
```

`source` must be one of: `youtube` · `github` · `instagram` · `tiktok` · `reddit` · `linkedin` · `article`

`origin` should always be `"added"` for user-submitted URLs.

**Security — SSRF prevention (critical):**
The backend must validate the URL before fetching it:

- Allow only `https:` protocol
- Resolve the hostname to an IP **before** fetching, then reject private/loopback ranges:
  `127.x`, `10.x`, `192.168.x`, `172.16–31.x`, `169.254.x` (AWS metadata), `::1`, `fc00::/7`
- Hard timeout on the fetch (5 s recommended)
- No redirects to private IPs
- Run the outbound fetch in a sandboxed network namespace if possible

Frontend does its own client-side pre-validation (`src/utils/validateUrl.js`) but that
is trivially bypassed — backend validation is the real gate.

---

### `POST /api/search`

Triggered when the user types a question into the search bar and hits Enter.
The frontend sends the query; the backend uses **semantic vector search** to find
the best match and returns its ID.

**Embedding approach — Voyage AI `voyage-4-nano`:**
We use incremental embedding with a flat vector store (no vector DB needed).

- **Model:** `voyage-4-nano` — free, open-weight (Apache 2.0), Anthropic's
  officially recommended embedding provider.
- **Why free:** Voyage AI offers 200M free tokens per account for their models,
  and `voyage-4-nano` is free indefinitely. Google Cloud's $300 trial credit
  explicitly excludes the Gemini API (confirmed broken in 2026), so Gemini
  embeddings are not an option without a separate billing account.
- **How it works:**
  1. When a node is added, call `POST https://api.voyageai.com/v1/embeddings`
     with the node's summary. Store the returned vector (1024 floats) alongside
     the node record.
  2. At search time, embed the user's query (one API call), then compute cosine
     similarity in memory against all stored vectors. Return the top match.
- **Scale:** 10,000 nodes ≈ 40 MB RAM, ~5 ms scan on CPU — no infrastructure
  needed until hundreds of thousands of nodes.
- **API key:** Sign up at https://www.voyageai.com no credit card required.
  Set as `VOYAGE_API_KEY` environment variable on the backend.

**Current stub (frontend):**
The frontend still sends the full `nodes` payload (summaries included) as a
fallback for the demo. Once the backend has stored vectors, replace `nodes` with
`nodeIds` only and look up records server-side.

**Why not LLM stuffing:**
At ~65 tokens per summary, 1,000 nodes = 65,000 tokens per search request.
At scale this is expensive and slow. Embeddings cost fractions of a cent total
for the entire lifetime of the app and return results in milliseconds.

**Request**

```json
{
  "query": "what was that video about soil temperature?",
  "nodes": [
    {
      "id": "node-3",
      "summary": "Video explaining optimal soil temperature for tomatoes...",
      "url": "https://youtube.com/watch?v=abc123",
      "source": "youtube",
      "category": "gardening",
      "subcategory": null
    }
  ]
}
```

`nodes` contains only the nodes in the user-selected category (or all nodes if
"All" is selected). The frontend does the filtering before sending.

When the backend has its own persistent DB, you can replace `nodes` with
`nodeIds` and look up records server-side — the frontend can easily be updated
to send IDs only.

**Response — match found**

```json
{ "nodeId": "node-3" }
```

**Response — no match**

```json
{ "nodeId": null }
```

The frontend pans/zooms to the matched node and shows a pulsing highlight.
If `nodeId` is `null` it shows "No matching node found."

---

### `GET /api/graph` and `POST /api/graph`

Currently the graph is loaded from a hardcoded `demoData.js` file and saved
only to `localStorage` (positions) or not at all (node additions/deletions).

**On app load — replace `demoData` import:**

```
GET /api/graph
→ {
    nodes:      [...],     // data node records (see Node schema below)
    categories: [...],     // user-created categories with no nodes yet (see §9)
    positions:  { subcategory: {...}, platform: {...}, timeline: {...} }
  }
```

`nodes` should match the node schema below.
`categories` is the list of empty user-created categories (see §9).
`positions` is the per-view-mode position map (see §5 below).

**On auto-save (debounced, ~2 s after last change):**

```
POST /api/graph
{ nodes: [...], edges: [...] }
```

**On node position drag-stop:**

```
PATCH /api/graph/positions
{ viewMode: "subcategory", positions: { "node-1": { "x": 120, "y": 340 }, ... } }
```

---

### Node schema

Every node in the graph follows this shape (same for request and response):

```js
{
  id:          string,           // e.g. "node-1", "node-added-1712345678900"
  category:    string,           // e.g. "ai", "gardening", "guitar"
  subcategory: string | null,    // e.g. "Machine Learning", null
  source:      string,           // "youtube" | "github" | "instagram" | "tiktok" | "reddit" | "linkedin" | "article"
  url:         string,           // full https:// URL
  summary:     string,           // ~50-word plain-text summary
  datetime:    string,           // ISO 8601, used for chronological ordering in Timeline view
  origin:      "shared"          // pre-loaded/demo content
               | "added"         // user added via FAB
               | "suggested"     // future: AI-suggested node
}
```

---

---

## Frontend Implementation Notes

### §1 — URL classification stub

**File:** `src/utils/fakeApi.js` → `analyseUrl(url)`

Simulates 900 ms delay, always returns `category: 'ai', subcategory: 'LLM & Prompting'`.
Replace the body with a real `fetch('/api/analyse', ...)` call.

---

### §2 — `source` field is client-side detected (7 known domains)

**File:** `src/utils/fakeApi.js` → `detectSource(url)`

Derives `source` from the URL hostname. Unknown domains fall back to `'article'`.
Once the backend returns a typed `source`, delete `detectSource` and trust the response.

---

### §3 — New nodes append surgically; new categories fall back to origin

**File:** `src/App.jsx` → `handleAddNode`

When a URL is analysed, the new node is appended 120 px below the last node in its
lane without rebuilding the whole graph. If the returned `category` does not yet
exist in the current graph, the node falls to `x: 0, y: 0` and its edge source
may not exist.

Fix when ready: if `laneNodes` is empty, call `buildGraph` on the full updated
dataset and push the result to `setNodes`/`setEdges`.

---

### §4 — Search stub always returns first candidate

**File:** `src/utils/searchNodes.js`

The request payload is fully built and the real `fetch('/api/search', ...)` call is
written in the file — just commented out. The hardcoded fallback below it returns
the first candidate so the highlight/zoom UI works without a backend.
To activate: uncomment the fetch block and delete the hardcoded lines.

---

### §5 — Node positions stored in localStorage, not the backend

**File:** `src/App.jsx` — `loadSavedPositions`, `savePositionsForMode`

Positions are saved under `localStorage` key `brain-stack-positions` as
`{ [viewMode]: { [nodeId]: { x, y } } }`, one entry per view mode so each
layout remembers where you left it. Survives page refresh; wiped by clearing
browser data.

Replace `savePositionsForMode` with a debounced `PATCH /api/graph/positions` call.
Load positions from `GET /api/graph` on mount instead of localStorage.

---

### §6 — Demo data is static; auto-save indicator is UI-only

**File:** `src/data/demoData.js`; `src/App.jsx` → `triggerAutoSave`

17 hardcoded nodes load on startup. The "Saved ✓" indicator fires on every
intentional change but writes nothing to a server. On page refresh the graph
resets to demo data with localStorage positions applied on top.

Replace the `demoData` import with `GET /api/graph`. Add a debounced
`POST /api/graph` call inside `triggerAutoSave`.

---

### §7 — URL security validation is frontend-only

**File:** `src/utils/validateUrl.js`

Four client-side checks: `https:` only, no private IPs, no embedded credentials,
max 2048 chars. These are trivially bypassed. See the SSRF section under
`POST /api/analyse` above for what the backend must enforce.

---

### §8 — View picker panel may clip on narrow viewports

**File:** `src/components/Toolbar/Toolbar.css` — `.view-picker`

Uses `position: absolute; left: calc(100% + 8px)`. No smart repositioning — on
viewports narrower than ~300 px the panel may clip the right edge.

Fix: `getBoundingClientRect` check on open; flip to `right: calc(100% + 8px)` if overflow.

---

### §9 — Empty categories stored in a separate table, not as dummy nodes

**Background:**
When a user creates a new category without adding any nodes to it, there is no
data record to attach the category to. Instead of inserting a sentinel/dummy node,
empty categories are stored in a dedicated `categories` table in the database.

**Why not a dummy node:**
Dummy nodes would pollute the node table, require every consumer to filter them out,
and break node-count logic (e.g. the flag menu shows "X nodes in this category").

**Backend — Supabase table:**

```sql
CREATE TABLE categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  color      text NOT NULL,            -- hex string, e.g. "#22c55e"
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, name)
);
```

**API endpoints:**

`POST /api/categories` — create an empty category for the authenticated user.

```json
Request:  { "name": "cooking", "color": "#22c55e" }
Response: { "id": "<uuid>", "name": "cooking", "color": "#22c55e" }
```

`DELETE /api/categories/:name` — delete a category (only needed if the category
still has no nodes; categories with nodes are implicitly defined by their nodes).

**Lifecycle:**
- Row is created when the user creates a new category with no initial node.
- Row is deleted (or simply ignored) once the first node with that category is saved —
  the category is now implicitly defined by its nodes.
- `GET /api/graph` returns both `nodes` and `categories` so the frontend can render
  flag nodes for empty categories alongside populated ones.

**Frontend:**

**File:** `src/App.jsx` — `userCategoriesRef`, `handleAddCategory`

`userCategoriesRef` (a `useRef`) holds `[{ name, color }]` — the list of empty
categories for the current user. It is:
- Populated from `data.categories` in the sign-in effect.
- Extended by `handleAddCategory` (and a stubbed `POST /api/categories` call fires).
- Pruned in `handleAddNode` when the first node is added to a previously empty category.

**File:** `src/utils/buildGraph.js` — `buildGraph(dataNodes, viewMode, extraCategories)`

`extraCategories` (`[{ name, color }]`) are rendered as lone flag nodes placed after
all populated category trees. Categories already present in `dataNodes` are skipped
to prevent duplicate flags.
