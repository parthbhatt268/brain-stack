import { getCategoryColor } from './categoryColors';

const CATEGORY_X_SPACING = 220; // gap between separate category groups
const BRANCH_X_SPACING   = 160; // gap between subcategory branches within a split category
const Y_TIME_SCALE        = 0.12; // px per hour — keeps nodes compact
const FLAG_Y_OFFSET       = 90;  // px above the topmost node in the tree

/**
 * Build the full ReactFlow node + edge graph from raw data nodes.
 *
 * @param {object[]} dataNodes - raw node records from demoData / DB
 * @param {Set<string>} splitCategories - categories currently in split (branched) mode
 */
export function buildGraph(dataNodes, splitCategories = new Set()) {
  if (!dataNodes.length) return { nodes: [], edges: [] };

  const sorted = [...dataNodes].sort(
    (a, b) => new Date(a.datetime) - new Date(b.datetime),
  );

  const earliestTime = new Date(sorted[0].datetime).getTime();

  // Unique categories in first-appearance order
  const categories = [...new Set(sorted.map(n => n.category))];

  // ── Assign x positions for each lane ────────────────────────────────────
  // laneX key: "category" for non-split, "category::subcategory" for split
  const laneX          = {};
  const categoryFlagX  = {}; // center x for each category's flag

  let cursor = 0;

  for (const cat of categories) {
    if (splitCategories.has(cat)) {
      const subcats = [
        ...new Set(
          sorted
            .filter(n => n.category === cat)
            .map(n => n.subcategory || 'General'),
        ),
      ];

      const startX = cursor;
      for (const sub of subcats) {
        laneX[`${cat}::${sub}`] = cursor;
        cursor += BRANCH_X_SPACING;
      }
      // Center the flag over all branches
      categoryFlagX[cat] = startX + ((subcats.length - 1) * BRANCH_X_SPACING) / 2;
      // Extra gap before the next category
      cursor += CATEGORY_X_SPACING - BRANCH_X_SPACING;
    } else {
      laneX[cat]         = cursor;
      categoryFlagX[cat] = cursor;
      cursor += CATEGORY_X_SPACING;
    }
  }

  // ── Brain nodes ──────────────────────────────────────────────────────────
  const brainNodes = sorted.map(item => {
    const hoursFromStart =
      (new Date(item.datetime).getTime() - earliestTime) / (1000 * 60 * 60);

    const laneKey = splitCategories.has(item.category)
      ? `${item.category}::${item.subcategory || 'General'}`
      : item.category;

    return {
      id: item.id,
      type: 'brainNode',
      position: {
        x: laneX[laneKey] ?? 0,
        y: hoursFromStart * Y_TIME_SCALE,
      },
      data: {
        ...item,
        color: getCategoryColor(item.category),
      },
    };
  });

  // ── Flag nodes — one per category, centered above its tree ───────────────
  const flagNodes = categories.map(cat => {
    const catNodes = brainNodes.filter(n => n.data.category === cat);
    const minY = Math.min(...catNodes.map(n => n.position.y));

    return {
      id: `flag-${cat}`,
      type: 'flagNode',
      position: {
        x: categoryFlagX[cat],
        y: minY - FLAG_Y_OFFSET,
      },
      data: { category: cat, color: getCategoryColor(cat) },
      draggable: true,   // flags are movable
      selectable: false, // but not selectable — clicking opens FlagMenu instead
    };
  });

  const nodes = [...flagNodes, ...brainNodes];

  // ── Edges ────────────────────────────────────────────────────────────────
  const edges = [];

  for (const cat of categories) {
    const color    = getCategoryColor(cat);
    const catNodes = brainNodes.filter(n => n.data.category === cat);

    if (splitCategories.has(cat)) {
      // Group into subcategory branches
      const branchMap = {};
      for (const node of catNodes) {
        const sub = node.data.subcategory || 'General';
        if (!branchMap[sub]) branchMap[sub] = [];
        branchMap[sub].push(node);
      }

      for (const branchNodes of Object.values(branchMap)) {
        const chronological = [...branchNodes].sort(
          (a, b) => new Date(a.data.datetime) - new Date(b.data.datetime),
        );

        // Flag → first node of branch
        edges.push({
          id: `edge-flag-${cat}-${chronological[0].id}`,
          source: `flag-${cat}`,
          target: chronological[0].id,
          type: 'smoothstep',
          style: { stroke: color, strokeWidth: 2 },
        });

        // Chain within branch
        for (let i = 0; i < chronological.length - 1; i++) {
          edges.push({
            id: `edge-${chronological[i].id}-${chronological[i + 1].id}`,
            source: chronological[i].id,
            target: chronological[i + 1].id,
            type: 'smoothstep',
            style: { stroke: color, strokeWidth: 2 },
          });
        }
      }
    } else {
      // Single chronological chain
      const chronological = [...catNodes].sort(
        (a, b) => new Date(a.data.datetime) - new Date(b.data.datetime),
      );

      // Flag → first node
      edges.push({
        id: `edge-flag-${cat}`,
        source: `flag-${cat}`,
        target: chronological[0].id,
        type: 'smoothstep',
        style: { stroke: color, strokeWidth: 2 },
      });

      // Chain
      for (let i = 0; i < chronological.length - 1; i++) {
        edges.push({
          id: `edge-${chronological[i].id}-${chronological[i + 1].id}`,
          source: chronological[i].id,
          target: chronological[i + 1].id,
          type: 'smoothstep',
          style: { stroke: color, strokeWidth: 2 },
        });
      }
    }
  }

  return { nodes, edges };
}
