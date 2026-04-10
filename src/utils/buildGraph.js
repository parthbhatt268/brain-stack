import { getCategoryColor, setCategoryColor } from './categoryColors';
import { detectSource } from '../components/SourceIcon/SourceIcon';

const CATEGORY_X_SPACING = 220; // gap between separate category groups
const BRANCH_X_SPACING   = 160; // gap between branches within a category
const NODE_Y_SPACING      = 120; // fixed px between consecutive nodes in a lane
const FLAG_Y_OFFSET       = 280; // px above the topmost node
const SUBFLAG_Y_OFFSET    = 140; // px above the first node in each branch (FLAG_Y_OFFSET / 2)

/**
 * Build the full ReactFlow node + edge graph from raw data nodes.
 *
 * @param {object[]} dataNodes      - raw node records from demoData / DB
 * @param {'timeline'|'subcategory'|'platform'} viewMode
 *   timeline    — single chronological chain per category
 *   subcategory — branch per subcategory value within each category
 *   platform    — branch per source (youtube, github, etc.) within each category
 * @param {{ name: string, color: string }[]} extraCategories
 *   Categories that have no data nodes yet (user-created empty categories).
 *   Each gets a lone flag node placed after all populated category trees.
 */
export function buildGraph(dataNodes, viewMode = 'subcategory', extraCategories = []) {
  if (!dataNodes.length && !extraCategories.length) return { nodes: [], edges: [] };

  let flagNodes        = [];
  let subCategoryNodes = [];
  let brainNodes       = [];
  const edges          = [];
  let cursor           = 0;
  let existingCats     = new Set();

  // ── Populated categories (from data nodes) ─────────────────────────────────
  if (dataNodes.length) {
    const sorted = [...dataNodes].sort(
      (a, b) => new Date(a.datetime) - new Date(b.datetime),
    );

    // Unique categories in first-appearance order
    const categories = [...new Set(sorted.map(n => n.category))];
    existingCats = new Set(categories);

    const isBranched = viewMode !== 'timeline';

    function branchOf(item) {
      if (viewMode === 'subcategory') return item.subcategory || 'General';
      if (viewMode === 'platform')    return detectSource(item.url) || 'Other';
      return null;
    }

    function laneKeyOf(item) {
      const branch = branchOf(item);
      return branch ? `${item.category}::${branch}` : item.category;
    }

    // ── Assign x positions for each lane ──────────────────────────────────
    const laneX         = {};
    const categoryFlagX = {};

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
        categoryFlagX[cat] = startX + ((branches.length - 1) * BRANCH_X_SPACING) / 2;
        cursor += CATEGORY_X_SPACING - BRANCH_X_SPACING;
      } else {
        laneX[cat]         = cursor;
        categoryFlagX[cat] = cursor;
        cursor += CATEGORY_X_SPACING;
      }
    }

    // ── Brain nodes — equal vertical spacing per lane ──────────────────────
    const laneIndex = {};

    brainNodes = sorted.map(item => {
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

    // ── Flag nodes — one per category, centered above its tree ────────────
    flagNodes = categories.map(cat => {
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

    // ── SubCategory nodes — one per branch, only in subcategory mode ───────
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

    // ── Edges ──────────────────────────────────────────────────────────────
    for (const cat of categories) {
      const color    = getCategoryColor(cat);
      const catNodes = brainNodes.filter(n => n.data.category === cat);

      if (isBranched) {
        const branchMap = {};
        for (const node of catNodes) {
          const branch = branchOf(node.data);
          if (!branchMap[branch]) branchMap[branch] = [];
          branchMap[branch].push(node);
        }

        for (const [branch, brnNodes] of Object.entries(branchMap)) {
          const chron = [...brnNodes].sort(
            (a, b) => new Date(a.data.datetime) - new Date(b.data.datetime),
          );

          if (viewMode === 'subcategory') {
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
  }

  // ── Empty categories — flag-only, no brain nodes ───────────────────────────
  // Placed after all populated trees, one per entry not already in existingCats.
  const emptyCats = extraCategories.filter(c => !existingCats.has(c.name));
  const emptyFlagNodes = emptyCats.map(({ name, color }, i) => {
    setCategoryColor(name, color);
    return {
      id: `flag-${name}`,
      type: 'flagNode',
      position: { x: cursor + i * CATEGORY_X_SPACING, y: -FLAG_Y_OFFSET },
      data: { category: name, color },
      draggable: true,
      selectable: false,
    };
  });

  return {
    nodes: [...flagNodes, ...subCategoryNodes, ...brainNodes, ...emptyFlagNodes],
    edges,
  };
}
