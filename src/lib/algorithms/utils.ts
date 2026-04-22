import Graph from "graphology";
import { bfs } from "graphology-traversal";
import type { GraphData, GraphNode, AnalyticsResult } from "../types.js";
import { generateCommunityPalette } from "../oklch-palette.js";

/**
 * Build a graphology Graph instance from our GraphData.
 */
export function buildGraphologyGraph(data: GraphData): Graph {
  const graph = new Graph({ type: "directed", allowSelfLoops: true });

  for (const node of data.nodes) {
    if (!graph.hasNode(node.id)) {
      graph.addNode(node.id, { name: node.name, type: node.type });
    }
  }

  for (const link of data.links) {
    const src =
      typeof link.source === "object"
        ? (link.source as GraphNode).id
        : link.source;
    const tgt =
      typeof link.target === "object"
        ? (link.target as GraphNode).id
        : link.target;
    if (graph.hasNode(src) && graph.hasNode(tgt) && !graph.hasEdge(src, tgt)) {
      graph.addEdge(src, tgt);
    }
  }

  return graph;
}

export function mapToSortedResults(
  scores: Map<string, number>,
  data: GraphData,
  selectedNodeId: string,
): AnalyticsResult[] {
  const nodeMap = new Map(data.nodes.map((n) => [n.id, n]));

  // Pre-calculate edges from selected node for the isLinked flag
  const linkedNodes = new Set<string>();
  for (const link of data.links) {
    const src =
      typeof link.source === "object"
        ? (link.source as GraphNode).id
        : link.source;
    const tgt =
      typeof link.target === "object"
        ? (link.target as GraphNode).id
        : link.target;
    if (src === selectedNodeId) linkedNodes.add(tgt);
    if (tgt === selectedNodeId) linkedNodes.add(src);
  }

  return [...scores.entries()]
    .map(([nodeId, score]) => {
      const node = nodeMap.get(nodeId);
      return {
        nodeId,
        nodeName: node?.name ?? nodeId,
        nodeType: node?.type,
        score,
        isLinked: linkedNodes.has(nodeId),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 20); // top 20
}

/**
 * Diffusion / label propagation (Laplacian smoothing)
 * Diffuses community memberships across the graph to create smooth color transitions.
 */
export function diffuseColors(
  graph: Graph,
  graphData: GraphData,
  palette: Map<number, string>,
  iterations: number = 100,
  alpha: number = 0.9,
) {
  const nodes = graphData.nodes;
  const nodeCount = nodes.length;
  const communityCount = palette.size;
  if (nodeCount === 0 || communityCount === 0) return;

  const idToIndex = new Map<string, number>();
  nodes.forEach((node, i) => idToIndex.set(node.id, i));

  // Soft memberships P[nodeIndex * communityCount + communityIndex]
  let P = new Float32Array(nodeCount * communityCount);
  const P0 = new Float32Array(nodeCount * communityCount);

  // Initialize one-hot
  for (let i = 0; i < nodeCount; i++) {
    const comm = nodes[i].community;
    if (comm !== undefined && comm < communityCount) {
      const idx = i * communityCount + comm;
      P[idx] = 1.0;
      P0[idx] = 1.0;
    }
  }

  for (let t = 0; t < iterations; t++) {
    const P_new = new Float32Array(nodeCount * communityCount);

    for (let i = 0; i < nodeCount; i++) {
      const nodeId = nodes[i].id;
      const neighbors = graph.neighbors(nodeId);

      if (neighbors.length === 0) {
        for (let c = 0; c < communityCount; c++) {
          const idx = i * communityCount + c;
          P_new[idx] = P[idx];
        }
      } else {
        // Average over neighbors
        for (const neighborId of neighbors) {
          const j = idToIndex.get(neighborId);
          if (j !== undefined) {
            const weight = 1.0 / neighbors.length;
            for (let c = 0; c < communityCount; c++) {
              P_new[i * communityCount + c] +=
                P[j * communityCount + c] * weight;
            }
          }
        }
      }

      // Anchor to original labels
      for (let c = 0; c < communityCount; c++) {
        const idx = i * communityCount + c;
        P_new[idx] = alpha * P_new[idx] + (1 - alpha) * P0[idx];
      }
    }
    P = P_new;
  }

  // Final color assignment
  for (let i = 0; i < nodeCount; i++) {
    const colorsWithWeights = [];
    for (let c = 0; c < communityCount; c++) {
      const weight = P[i * communityCount + c];
      if (weight > 0.005) {
        const color = palette.get(c);
        if (color) {
          colorsWithWeights.push({ color, weight });
        }
      }
    }

    if (colorsWithWeights.length > 0) {
      nodes[i].color = mixOKLCHColors(colorsWithWeights);
    }
  }
}

function parseOKLCH(s: string) {
  const match = s.match(/oklch\(([\d.-]+) ([\d.-]+) ([\d.-]+)\)/);
  if (!match) return { l: 0.5, c: 0.1, h: 0 };
  return {
    l: parseFloat(match[1]),
    c: parseFloat(match[2]),
    h: parseFloat(match[3]),
  };
}

function formatOKLCH(l: number, c: number, h: number) {
  return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`;
}

function mixOKLCHColors(
  colorsWithWeights: { color: string; weight: number }[],
) {
  let totalL = 0;
  let totalC = 0;
  let totalX = 0;
  let totalY = 0;
  let totalW = 0;

  for (const { color, weight } of colorsWithWeights) {
    const { l, c, h } = parseOKLCH(color);
    totalL += l * weight;
    totalC += c * weight;

    const rad = (h * Math.PI) / 180;
    totalX += Math.cos(rad) * weight;
    totalY += Math.sin(rad) * weight;

    totalW += weight;
  }

  if (totalW === 0) return "oklch(0.5 0 0)";

  const l = totalL / totalW;
  const c = totalC / totalW;
  const h = (Math.atan2(totalY, totalX) * 180) / Math.PI;

  return formatOKLCH(l, c, (h + 360) % 360);
}

/**
 * Finalizes community detection by ordering communities by structural proximity
 * and assigning colors from a consistent palette.
 */
export function finalizeCommunityColors(
  graph: Graph,
  data: GraphData,
  nodeToCommunity: Map<string, number> | { [key: string]: number },
): { palette: Map<number, string>; communityCount: number } {
  // Convert object-based communities to Map if necessary
  const nodeMap =
    nodeToCommunity instanceof Map
      ? nodeToCommunity
      : new Map(Object.entries(nodeToCommunity));

  // 1. Find unique communities
  const communitySet = new Set<number>();
  nodeMap.forEach((commId) => communitySet.add(commId));
  const uniqueCommunities = [...communitySet];

  if (uniqueCommunities.length === 0) {
    return { palette: new Map(), communityCount: 0 };
  }

  // 2. Build Meta-Graph: Each community is a node
  const metaGraph = new Graph({ type: "undirected" });
  uniqueCommunities.forEach((c) => metaGraph.addNode(c.toString()));

  graph.forEachEdge((_edge, _attr, source, target) => {
    const c1 = nodeMap.get(source);
    const c2 = nodeMap.get(target);
    if (c1 !== undefined && c2 !== undefined && c1 !== c2) {
      if (!metaGraph.hasEdge(c1.toString(), c2.toString())) {
        metaGraph.addEdge(c1.toString(), c2.toString());
      }
    }
  });

  // 3. Order by structural proximity (BFS)
  const orderedCommunities: number[] = [];


  bfs(metaGraph, (n, _attr, _dep) => {
    orderedCommunities.push(parseInt(n));
  });

  const remap = new Map<number, number>();
  orderedCommunities.forEach((oldC, newIdx) => remap.set(oldC, newIdx));

  const communityCount = uniqueCommunities.length;
  const palette = generateCommunityPalette(communityCount);

  // 5. Assign to data.nodes
  for (const node of data.nodes) {
    const rawCommunity = nodeMap.get(node.id);
    if (rawCommunity !== undefined) {
      const idx = remap.get(rawCommunity);
      if (idx !== undefined) {
        node.community = idx;
        node.color = palette.get(idx);
      }
    }
  }

  return { palette, communityCount };
}
