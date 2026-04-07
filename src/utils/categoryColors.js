// Pool of visually distinct colors for auto-assigning to categories
export const COLOR_POOL = [
  '#22c55e', // green
  '#ec4899', // pink
  '#ef4444', // red
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6', // teal
  '#a855f7', // purple
];

// Persistent map: category name -> color
const categoryColorMap = new Map();
let nextColorIndex = 0;

export function getCategoryColor(category) {
  if (!categoryColorMap.has(category)) {
    // Skip colors already taken by other categories
    const used = new Set(categoryColorMap.values());
    let color;
    for (let i = 0; i < COLOR_POOL.length; i++) {
      const candidate = COLOR_POOL[(nextColorIndex + i) % COLOR_POOL.length];
      if (!used.has(candidate)) {
        color = candidate;
        nextColorIndex = (nextColorIndex + i + 1) % COLOR_POOL.length;
        break;
      }
    }
    // All colors taken — wrap around and allow a duplicate
    if (!color) {
      color = COLOR_POOL[nextColorIndex % COLOR_POOL.length];
      nextColorIndex = (nextColorIndex + 1) % COLOR_POOL.length;
    }
    categoryColorMap.set(category, color);
  }
  return categoryColorMap.get(category);
}

/** Manually assign a color to a category (e.g. user-picked via the UI). */
export function setCategoryColor(category, color) {
  categoryColorMap.set(category, color);
}

/** Returns the set of hex colors currently assigned to any category. */
export function getUsedColors() {
  return new Set(categoryColorMap.values());
}
