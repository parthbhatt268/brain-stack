import { getCategoryColor } from './categoryColors';
import { detectSource } from '../components/SourceIcon/SourceIcon';

const CATEGORY_X_SPACING = 220; // gap between separate category groups
const BRANCH_X_SPACING   = 160; // gap between branches within a category
const NODE_Y_SPACING      = 120; // fixed px between consecutive nodes in a lane
const FLAG_Y_OFFSET       = 280; // px above the topmost node
const SUBFLAG_Y_OFFSET    = 140; // px above the first node in each branch (FLAG_Y_OFFSET / 2)

/**
 * Build the full ReactFlow node + edge graph from raw data nodes.
 *
 * @param {object[]} dataNodes - raw node records from demoData / DB
 * @param {'timeline'|'subcategory'|'platform'} viewMode
 *   timeline   — single chronological chain per category
 *   subcategory — branch per subcategory value within each category
 *   platform    — branch per source (youtube, github, etc.) within each category
 */
export function buildGraph(dataNodes, viewMode = 'subcategory') {
  if (!dataNodes.length) return { nodes: [], edges: [] };

  const sorted = [...dataNodes].sort(
    (a, b) => new Date(a.datetime) - new Date(b.datetime),
  );

  // Unique categories in first-appearance order
  const categories = [...new Set(sorted.map(n => n.category))];

  const isBranched = viewMode !== 'timeline';

  // Returns the branch label for an item, or null if no branching
  function branchOf(item) {
    if (viewMode === 'subcategory') return item.subcategory || 'General';
    if (viewMode === 'platform')    return detectSource(item.url) || 'Other';
    return null;
  }

  function laneKeyOf(item) {
    const branch = branchOf(item);
    return branch ? `${item.category}::${branch}` : item.category;
  }

  // ── Assign x positions for each lane ────────────────────────────────────
  const laneX         = {};
  const categoryFlagX = {};
  let cursor = 0;

  for (const cat of categories) {
    if (isBranched) {
      const branches = [
        ...new Set(sorted.filter(n => n.category === cat).map(branchOf)),
      ];

      const startX = cursor;
      for (const branch of branches) {
        laneX[`${cat}::${branch}`] = cursor;
        cursor += BRANCH_X_SPACING;
      }
      // Center the flag over all branches
      categoryFlagX[cat] = startX + ((branches.length - 1) * BRANCH_X_SPACING) / 2;
      cursor += CATEGORY_X_SPACING - BRANCH_X_SPACING;
    } else {
      laneX[cat]         = cursor;
      categoryFlagX[cat] = cursor;
      cursor += CATEGORY_X_SPACING;
    }
  }

  // ── Brain nodes — equal vertical spacing per lane ────────────────────────
  const laneIndex = {};

  const brainNodes = sorted.map(item => {
    const key = laneKeyOf(item);
    if (laneIndex[key] === undefined) laneIndex[key] = 0;
    const idx = laneIndex[key]++;

    return {
      id: item.id,
      type: 'brainNode',
      position: { x: laneX[key] ?? 0, y: idx * NODE_Y_SPACING },
      data: { ...item, color: getCategoryColor(item.category) },
    };
  });

  // ── Flag nodes — one per category, centered above its tree ───────────────
  const flagNodes = categories.map(cat => {
    const catNodes = brainNodes.filter(n => n.data.category === cat);
    const minY = Math.min(...catNodes.map(n => n.position.y));

    return {
      id: `flag-${cat}`,
      type: 'flagNode',
      position: { x: categoryFlagX[cat], y: minY - FLAG_Y_OFFSET },
      data: { category: cat, color: getCategoryColor(cat) },
      draggable: true,
      selectable: false,
    };
  });

  // ── SubCategory nodes — one per branch, only in subcategory mode ─────────
  // Displayed as tag-chip nodes; absent in timeline and platform modes.
  const subCategoryNodes = [];
  if (viewMode === 'subcategory') {
    for (const cat of categories) {
      const color    = getCategoryColor(cat);
      const catNodes = brainNodes.filter(n => n.data.category === cat);

      const branchMap = {};
      for (const node of catNodes) {
        const branch = branchOf(node.data);
        if (!branchMap[branch]) branchMap[branch] = [];
        branchMap[branch].push(node);
      }

      for (const [branch, bNodes] of Object.entries(branchMap)) {
        const laneKey = `${cat}::${branch}`;
        const firstY  = Math.min(...bNodes.map(n => n.position.y));
        // SUBFLAG_Y_OFFSET = FLAG_Y_OFFSET / 2 keeps all three levels equidistant:
        // category flag (−200) → subcategory tag (−100) → first node (0)
        subCategoryNodes.push({
          id: `subcategory-${cat}-${branch}`,
          type: 'subCategoryNode',
          position: { x: laneX[laneKey] ?? categoryFlagX[cat], y: firstY - SUBFLAG_Y_OFFSET },
          data: { category: cat, label: branch, color },
          draggable: true,
          selectable: false,
        });
      }
    }
  }

  const nodes = [...flagNodes, ...subCategoryNodes, ...brainNodes];

  // ── Edges ────────────────────────────────────────────────────────────────
  const edges = [];

  for (const cat of categories) {
    const color    = getCategoryColor(cat);
    const catNodes = brainNodes.filter(n => n.data.category === cat);

    if (isBranched) {
      // Group into branches, then chain within each branch
      const branchMap = {};
      for (const node of catNodes) {
        const branch = branchOf(node.data);
        if (!branchMap[branch]) branchMap[branch] = [];
        branchMap[branch].push(node);
      }

      for (const [branch, branchNodes] of Object.entries(branchMap)) {
        const chron = [...branchNodes].sort(
          (a, b) => new Date(a.data.datetime) - new Date(b.data.datetime),
        );

        if (viewMode === 'subcategory') {
          // category flag → subcategory tag node → first branch node
          const subCatId = `subcategory-${cat}-${branch}`;
          edges.push({
            id: `edge-flag-${cat}-${subCatId}`,
            source: `flag-${cat}`,
            target: subCatId,
            type: 'default',
            style: { stroke: color, strokeWidth: 2 },
          });
          edges.push({
            id: `edge-${subCatId}-${chron[0].id}`,
            source: subCatId,
            target: chron[0].id,
            type: 'default',
            style: { stroke: color, strokeWidth: 2 },
          });
        } else {
          // platform mode: category flag → first branch node directly
          edges.push({
            id: `edge-flag-${cat}-${chron[0].id}`,
            source: `flag-${cat}`,
            target: chron[0].id,
            type: 'default',
            style: { stroke: color, strokeWidth: 2 },
          });
        }

        for (let i = 0; i < chron.length - 1; i++) {
          edges.push({
            id: `edge-${chron[i].id}-${chron[i + 1].id}`,
            source: chron[i].id,
            target: chron[i + 1].id,
            type: 'default',
            style: { stroke: color, strokeWidth: 2 },
          });
        }
      }
    } else {
      // Single chronological chain
      const chron = [...catNodes].sort(
        (a, b) => new Date(a.data.datetime) - new Date(b.data.datetime),
      );

      edges.push({
        id: `edge-flag-${cat}`,
        source: `flag-${cat}`,
        target: chron[0].id,
        type: 'default',
        style: { stroke: color, strokeWidth: 2 },
      });

      for (let i = 0; i < chron.length - 1; i++) {
        edges.push({
          id: `edge-${chron[i].id}-${chron[i + 1].id}`,
          source: chron[i].id,
          target: chron[i + 1].id,
          type: 'default',
          style: { stroke: color, strokeWidth: 2 },
        });
      }
    }
  }

  return { nodes, edges };
}
