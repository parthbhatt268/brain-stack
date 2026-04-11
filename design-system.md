# Brain Stack — Design System

Reference this file when building any new UI. Match these patterns exactly — don't introduce new colors, fonts, or component styles.

---

## Font

```css
font-family: system-ui, 'Segoe UI', Roboto, sans-serif;
-webkit-font-smoothing: antialiased;
```

No external font imports. Uses the OS system font stack.

---

## Color Tokens (CSS Variables)

Defined in `src/index.css`. Always use these variables — never hardcode hex values except where noted below.

### Light mode (default)
| Variable | Value | Usage |
|---|---|---|
| `--accent` | `#f7c948` | Primary action color (buttons, logo, highlights) |
| `--accent-alpha` | `rgba(247,201,72,0.15)` | Button glow / box-shadow |
| `--bg` | `#fafafa` | Canvas background |
| `--node-bg` | `#ffffff` | Node card background |
| `--node-border` | `#1a1a1a` | Node outline |
| `--tooltip-bg` | `#ffffff` | Modal / popover background |
| `--tooltip-text` | `#1e293b` | Body text inside modals |
| `--toolbar-bg` | `rgba(255,255,255,0.85)` | Frosted glass panels (ribbon, toolbar) |
| `--toolbar-border` | `rgba(0,0,0,0.08)` | Panel borders, dividers |
| `--toolbar-text` | `#334155` | Text in panels |
| `--toolbar-btn-hover` | `rgba(0,0,0,0.06)` | Button hover fill |
| `--toolbar-btn-active` | `rgba(0,0,0,0.10)` | Button active/pressed fill |
| `--dot-color` | `#8888a0` | Canvas dot grid |
| `--handle-bg` | `#94a3b8` | ReactFlow edge handles |
| `--edge-color` | `#1a1a1a` | Edges (overridden per-category) |

### Dark mode (`[data-theme='dark']`)
| Variable | Value |
|---|---|
| `--bg` | `#0f172a` |
| `--node-bg` | `#1e293b` |
| `--node-border` | `#e5e5e5` |
| `--tooltip-bg` | `#1e293b` |
| `--tooltip-text` | `#e2e8f0` |
| `--toolbar-bg` | `rgba(30,41,59,0.9)` |
| `--toolbar-border` | `rgba(255,255,255,0.08)` |
| `--toolbar-text` | `#cbd5e1` |
| `--toolbar-btn-hover` | `rgba(255,255,255,0.08)` |
| `--accent-alpha` | `rgba(247,201,72,0.12)` |

`--accent` (#f7c948) is the same in both themes.

### Hardcoded values (acceptable exceptions)
- Primary button text: `#1a1000` (warm black on yellow)
- Delete/danger: `#dc2626` light / `#f87171` dark
- Origin badges: fixed light/dark pairs (see NodeModal.css)

---

## Typography Scale

| Role | Size | Weight | Other |
|---|---|---|---|
| Logo / brand | 16px | 700 | `letter-spacing: -0.3px`, color `var(--accent)` |
| Modal title | 1.375rem | 700 | `letter-spacing: -0.4px` |
| Button | 13px | 600 | — |
| Body / summary | 14px | 400 | `line-height: 1.6` |
| Meta / label | 12px | 400–600 | — |
| Section header | 11px | 700 | `text-transform: uppercase; letter-spacing: 0.7px` |
| Tag / badge | 11px | 600 | `text-transform: uppercase; letter-spacing: 0.4px` |

---

## Border Radius

| Context | Radius |
|---|---|
| Modals, cards | `16px` |
| Buttons, inputs | `10px` |
| Icon buttons, small chips | `8px` |
| Avatar / user icon | `50%` |
| Dropdown menus | `10px` |
| Brain nodes | `50%` (circular) |

---

## Buttons

### Primary (accent)
```css
background: var(--accent);
color: #1a1000;
border: 1px solid transparent;
border-radius: 10px;
padding: 9px 18px;
font-size: 13px;
font-weight: 600;
box-shadow: 0 2px 10px var(--accent-alpha);
```
Hover: `filter: brightness(1.08)`

### Ghost / secondary
```css
background: transparent;
color: var(--toolbar-text);
border: 1px solid var(--toolbar-border);
border-radius: 10px;
padding: 9px 18px;
font-size: 13px;
font-weight: 600;
```
Hover: `background: var(--toolbar-btn-hover)`

### Icon button (toolbar)
```css
width: 32px; height: 32px;
border-radius: 8px;
border: none;
background: transparent;
color: var(--toolbar-text);
opacity: 0.5;
```
Hover: `opacity: 1; background: var(--toolbar-btn-hover)`

### Shared states
```css
:disabled { opacity: 0.5; cursor: not-allowed; }
:active   { transform: scale(0.97); }
```

---

## Modals / Panels

### Backdrop
```css
position: fixed; inset: 0; z-index: 40;
background: rgba(0, 0, 0, 0.45);
backdrop-filter: blur(3px);
display: flex; align-items: center; justify-content: center;
padding: 24px;
animation: backdrop-in 0.2s ease;
```

### Panel
```css
background: var(--tooltip-bg);
border: 1px solid var(--toolbar-border);
border-radius: 16px;
box-shadow: 0 24px 64px rgba(0, 0, 0, 0.25);
max-width: 460px; width: 100%;
animation: modal-in 0.22s cubic-bezier(0.34, 1.3, 0.64, 1);
```

### Entry animations
```css
@keyframes backdrop-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes modal-in {
  from { opacity: 0; transform: scale(0.94) translateY(12px); }
  to   { opacity: 1; transform: scale(1)    translateY(0); }
}
```

### Internal structure
- **Header**: `padding: 16px 20px`, `border-bottom: 1px solid var(--toolbar-border)`
- **Body**: `padding: 20px`, `display: flex; flex-direction: column; gap: 16px`
- **Footer**: `padding: 12px 20px 16px`, `border-top: 1px solid var(--toolbar-border)`

---

## Frosted Glass Panels (Ribbon, Toolbar)

```css
background: var(--toolbar-bg);
backdrop-filter: blur(12px);
border-bottom: 1px solid var(--toolbar-border); /* or border */
```

---

## Spacing

- Component internal padding: `16px–24px`
- Gap between sibling elements: `8px–12px`
- Gap in flex rows (toolbar): `6px–8px`
- Section gap in modals: `16px`

---

## Icons

- **Toolbar / UI icons**: [Lucide React](https://lucide.dev/) — consistent stroke width, `size` prop
- **Source brand icons**: `react-icons/si` (GitHub, YouTube, Instagram, TikTok, Reddit) with official brand hex colors
- **LinkedIn**: inline SVG (removed from Simple Icons) — fill `#0A66C2`
- **Article / unknown**: Lucide `FileText`
- **App logo**: `/public/brain-stack.ico` and `/public/favicon.svg`

---

## Graph Nodes

| Type | Shape | Notes |
|---|---|---|
| `brainNode` | Circle (64×64px) | Shows source icon + category color badge |
| `flagNode` | Flag SVG | One per category, draggable, not selectable |
| `subCategoryNode` | Pill/label | One per subcategory branch, subcategory view only |

Category colors auto-assigned from a fixed pool via `getCategoryColor(category)` in `src/utils/categoryColors.js`. Always call this utility — never hardcode a category color.

---

## Transitions

- **Default UI**: `0.15s` ease — hover states, opacity changes
- **Modal entry**: `0.22s cubic-bezier(0.34, 1.3, 0.64, 1)` — springy scale+translate
- **Backdrop**: `0.2s ease` — fade
- **Theme switch**: `0.25s` — background, transform
- **fitView pan**: `600ms` duration (ReactFlow)
- **Zoom controls**: `350ms` duration

---

## Mobile

- Modals become **bottom sheets** at `max-width: 600px`:
  ```css
  border-radius: 20px 20px 0 0;
  max-height: 92dvh;
  overflow-y: auto;
  animation: modal-in-mobile 0.28s cubic-bezier(0.34, 1.1, 0.64, 1);
  ```
- Button rows stack vertically (`flex-direction: column-reverse`)
- Touch: long-press on brain nodes opens detail modal (desktop uses double-click)

---

## Z-index Layers

| Layer | Value |
|---|---|
| Canvas (ReactFlow) | default (0) |
| Ribbon / Toolbar | 20 |
| Modals / Popovers | 40 |
| Sign-in overlay | 100 |
