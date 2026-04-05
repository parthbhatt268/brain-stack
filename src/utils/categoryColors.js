// Pool of visually distinct colors for auto-assigning to categories
const COLOR_POOL = [
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
    categoryColorMap.set(category, COLOR_POOL[nextColorIndex % COLOR_POOL.length]);
    nextColorIndex++;
  }
  return categoryColorMap.get(category);
}

export function getAllCategoryColors() {
  return Object.fromEntries(categoryColorMap);
}
