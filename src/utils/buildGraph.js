import { getCategoryColor } from './categoryColors';

const CATEGORY_X_SPACING = 200;
const Y_TIME_SCALE = 0.12; // px per hour from earliest node — keeps nodes compact

export function buildGraph(dataNodes) {
  if (!dataNodes.length) return { nodes: [], edges: [] };

  // Sort all nodes by datetime
  const sorted = [...dataNodes].sort(
    (a, b) => new Date(a.datetime) - new Date(b.datetime),
  );

  const earliestTime = new Date(sorted[0].datetime).getTime();

  // Group by category to assign x-lanes and build edges
  const categories = [...new Set(sorted.map(n => n.category))];

  const categoryLane = {};
  categories.forEach((cat, i) => {
    categoryLane[cat] = i;
  });

  // Build flow nodes
  const nodes = sorted.map(item => {
    const hoursFromStart =
      (new Date(item.datetime).getTime() - earliestTime) / (1000 * 60 * 60);
    const y = hoursFromStart * Y_TIME_SCALE;
    const x = categoryLane[item.category] * CATEGORY_X_SPACING;

    return {
      id: item.id,
      type: 'brainNode',
      position: { x, y },
      data: {
        ...item,
        color: getCategoryColor(item.category),
      },
    };
  });

  // Build edges: chain nodes within same category in chronological order
  const categoryChains = {};
  for (const item of sorted) {
    if (!categoryChains[item.category]) categoryChains[item.category] = [];
    categoryChains[item.category].push(item.id);
  }

  const edges = [];
  for (const [category, ids] of Object.entries(categoryChains)) {
    const color = getCategoryColor(category);
    for (let i = 0; i < ids.length - 1; i++) {
      edges.push({
        id: `edge-${ids[i]}-${ids[i + 1]}`,
        source: ids[i],
        target: ids[i + 1],
        style: { stroke: color, strokeWidth: 2 },
        animated: false,
      });
    }
  }

  return { nodes, edges };
}

/**
 * Rebuilds only the edges from the current flow nodes (used after category changes).
 * Nodes are sorted by y-position within each category to preserve the timeline order.
 */
export function rebuildEdges(flowNodes) {
  const groups = {};
  for (const node of flowNodes) {
    const cat = node.data.category;
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(node);
  }

  const edges = [];
  for (const [category, groupNodes] of Object.entries(groups)) {
    const sorted = [...groupNodes].sort((a, b) => a.position.y - b.position.y);
    const color = getCategoryColor(category);
    for (let i = 0; i < sorted.length - 1; i++) {
      edges.push({
        id: `edge-${sorted[i].id}-${sorted[i + 1].id}`,
        source: sorted[i].id,
        target: sorted[i + 1].id,
        style: { stroke: color, strokeWidth: 2 },
        animated: false,
      });
    }
  }
  return edges;
}
