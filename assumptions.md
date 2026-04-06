# assumptions.md

Tracks every hard-coded value, stub, and deferred decision in the codebase.
Update this file whenever a stub is removed or a new one is added.

---

## 1. URL classification API always returns AI / LLM & Prompting

**File:** `src/utils/fakeApi.js` → `analyseUrl(url)`

**What it does now:**
Simulates a 900 ms network delay, then unconditionally returns:
```js
{ category: 'ai', subcategory: 'LLM & Prompting', source: <detected>, summary: <placeholder>, origin: 'added' }
```

**What it should do:**
Call a real backend endpoint (e.g. `POST /api/analyse`) that fetches/scrapes the URL, classifies it with an LLM or classifier, and returns `{ category, subcategory, source, summary, origin }`.

**How to remove the stub:**
Replace the body of `analyseUrl` with a real `fetch('/api/analyse', { method: 'POST', body: JSON.stringify({ url }) })` call.

---

## 2. "Group by Platform" branches on the `source` field, which is client-side detected

**File:** `src/utils/buildGraph.js` — `viewMode === 'platform'` path; `src/utils/fakeApi.js` → `detectSource`

**What it does now:**
In platform view, each category is split into branches by `item.source` (e.g., `youtube`, `github`). For demo data this is hardcoded; for nodes added via the FAB it is derived from the URL hostname using a 7-entry map. Unknown hostnames fall back to `'article'`.

**How to fix when ready:**
The classification backend should return a typed `source` enum. Extend the hostname map or trust the backend value entirely.

---

## 3. New nodes added via the FAB use surgical append, not a full graph rebuild

**File:** `src/App.jsx` → `handleAddNode`

**What it does now:**
Finds the bottom-most node in the target lane and appends 120 px below it with a connecting edge. The rest of the graph is untouched.

**Limitation:**
If the API returns a `category` that doesn't exist in the current graph (no flag, no lane), the new node falls back to `x: 0, y: 0` and the edge source `flag-<category>` may not exist, producing a disconnected edge.

**How to fix when ready:**
When `laneNodes` is empty and the category is new, call `buildGraph` on the full updated dataset and push the result to `setNodes`/`setEdges`.

---

## 4. Demo data is static — "auto-save" is UI-only with no backend persistence

**File:** `src/data/demoData.js`; `src/App.jsx` → `triggerAutoSave`

**What it does now:**
17 hardcoded nodes are loaded on startup. The "Saved ✓" ribbon indicator appears on intentional changes but no data is written anywhere. On page refresh the graph resets to the original demo data.

**How to fix when ready:**
On mount, fetch nodes from the backend instead of importing `demoData`. In `triggerAutoSave`, call a debounced `POST /api/save` with the current nodes/edges.

---

## 5. URL security validation is frontend-only

**File:** `src/utils/validateUrl.js`

**What it does now:**
Four checks before the URL reaches the backend: (1) `https:` protocol only, (2) no private/loopback IP in the hostname, (3) no embedded credentials, (4) max 2048 chars.

**Why this is not enough:**
Frontend checks are trivially bypassed. The backend must re-validate and — critically — resolve the hostname to an IP *before* fetching, then re-check it against the private-range blocklist (DNS rebinding resistance). Otherwise **SSRF** is possible (e.g. `https://169.254.169.254/` leaks AWS metadata).

**How to fix when backend is built:**
Re-validate protocol, credentials, and IP range server-side. Fetch with a hard timeout, no redirects to private IPs, inside a sandboxed network namespace.

---

## 6. View picker panel may clip on very narrow viewports

**File:** `src/components/Toolbar/Toolbar.css` — `.view-picker`

**What it does now:**
`position: absolute; left: calc(100% + 8px); top: 0` positions the panel to the right of the toolbar. Works correctly when the toolbar moves because it is toolbar-relative.

**Limitation:**
No smart repositioning — on viewports narrower than ~300 px the panel may clip the right edge of the screen.

**How to fix when ready:**
Use a `getBoundingClientRect` check on open and flip to `right: calc(100% + 8px)` when the panel would overflow the viewport.
