# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server (Vite HMR)
npm run lint     # ESLint across all .js/.jsx files
npm run build    # production build to dist/
npm run preview  # preview the production build
```

There are no tests yet. Do not run `npm run build` after making changes — the dev server without console errors is the accepted verification method.

## Architecture

Brain Stack is a personal knowledge graph built on **@xyflow/react** (ReactFlow v12). Each saved piece of content becomes a circular node on an infinite canvas, grouped into category trees.

### Data flow

Raw node records (`src/data/demoData.js`) → `buildGraph(dataNodes, splitCategories)` → ReactFlow `nodes[]` + `edges[]` → rendered on canvas.

`buildGraph` is the single source of truth for layout. It is called once on mount and again whenever the Default/Split view toggle fires. It is **not** reactive to state — call it explicitly and push the result into `setNodes`/`setEdges`.

### State that lives in `App.jsx` (`Flow` component)

| State | Purpose |
|---|---|
| `nodes / edges` | ReactFlow canvas state via `useNodesState` / `useEdgesState` |
| `isSplitMode` | Global Default ↔ Split toggle; drives which categories branch |
| `past / future` | Undo/redo stacks — snapshots of `{ nodes, edges }` |
| `savedSnapshot` | Last saved state; Discard restores to this |
| `isDirty` | Any meaningful change since last save |
| `clipboard` | Cut nodes waiting to be pasted |
| `activeNode` | Brain node whose detail modal is open |
| `flagMenu` | Flag node that was clicked; drives the FlagMenu popup |

### Node types

**`brainNode`** — the main content node. Circular, shows a brand source icon and a coloured category badge at the bottom. Has top (target) and bottom (source) handles for edges. Clicking opens `NodeModal`.

**`flagNode`** — one per category, sits above the tree. Shows a filled flag SVG + category name in the category colour. `selectable: false`, `draggable: true`. Clicking opens `FlagMenu` (info tooltip only, no actions).

### Category system

`src/utils/categoryColors.js` maintains a module-level `Map` of category → hex colour. Colours are auto-assigned from a fixed pool in first-seen order. Call `getCategoryColor(category)` anywhere; it is idempotent.

### Split mode layout

`buildGraph` accepts a `splitCategories: Set<string>`. Categories in this set are laid out with one horizontal lane per `subcategory` value (branching left-right); categories not in the set get a single vertical chain. The `SPLITTABLE_CATEGORIES` constant in `App.jsx` is derived from `demoData` — any category that has at least one node with a non-null `subcategory`.

Currently only `'ai'` is splittable. Gardening and Guitar stub `console.log('split triggered: …')`.

### Node schema

```js
{
  id: string,
  category: string,        // drives tree membership and colour
  subcategory: string|null, // null until split mode; required for branching
  source: string,          // 'youtube'|'github'|'instagram'|'tiktok'|'reddit'|'article'|'linkedin'
  url: string,
  summary: string,         // ~50 words
  datetime: ISO string,    // drives vertical position (older = higher y)
  origin: 'shared'|'added'|'suggested'
}
```

### Edge rules

- All edges are `type: 'smoothstep'` with `style: { stroke: categoryColor, strokeWidth: 2 }`.
- Default mode: flag → first node → … → last node (single chain per category, sorted by `datetime`).
- Split mode: flag → first node of each branch; nodes chain within their branch.
- Manual `onConnect`: target inherits source's category; edge gets the category colour.
- Delete key removes selected nodes or edges.

### Icons

`src/components/SourceIcon/SourceIcon.jsx` uses `react-icons/si` for brand icons (GitHub, YouTube, Instagram, TikTok, Reddit) with hardcoded brand hex colours. LinkedIn uses an inline SVG (removed from Simple Icons due to brand policy). Article/unknown falls back to Lucide `FileText`. Toolbar icons use Lucide throughout.

### Theme

CSS custom properties on `:root` / `[data-theme='dark']` in `src/index.css`. Theme is persisted to `localStorage` via `ThemeContext`. Key variables: `--accent` (Miro yellow `#f7c948`), `--node-bg`, `--node-border`, `--toolbar-bg`, `--dot-color`.
