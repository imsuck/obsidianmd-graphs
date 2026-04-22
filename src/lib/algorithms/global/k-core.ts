import type { GlobalAlgorithm, GraphData } from "../../types.js";
import { buildGraphologyGraph } from "../utils.js";
import { generateCommunityPalette } from "../../oklch-palette.js";

export const KCoreAlgorithm: GlobalAlgorithm = {
  id: "k-core",
  name: "K-Core Decomposition",
  description:
    "Partitions the graph into cores based on degrees. A k-core is a maximal subgraph where all nodes have degree at least k.",
  execute: (data: GraphData) => {
    const graph = buildGraphologyGraph(data);

    const degrees = new Map<string, number>();
    const nodes = graph.nodes();
    nodes.forEach((node: string) => degrees.set(node, graph.degree(node)));

    const coreness = new Map<string, number>();
    let k = 0;
    let nodesRemaining = nodes.length;

    while (nodesRemaining > 0) {
      let removedInThisIter = true;

      while (removedInThisIter) {
        removedInThisIter = false;
        for (const node of nodes) {
          if (!coreness.has(node) && degrees.get(node)! <= k) {
            coreness.set(node, k);
            nodesRemaining--;
            removedInThisIter = true;

            // Decrease degree of neighbors
            for (const neighbor of graph.neighbors(node)) {
              if (!coreness.has(neighbor)) {
                degrees.set(neighbor, degrees.get(neighbor)! - 1);
              }
            }
          }
        }
      }
      k++;
    }

    const communitySet = new Set(coreness.values());
    const palette = generateCommunityPalette(communitySet.size);

    const uniqueCommunities = [...communitySet].sort((a, b) => a - b);
    const remap = new Map<number, number>();
    uniqueCommunities.forEach((c, i) => remap.set(c, i));

    for (const node of data.nodes) {
      const rawCommunity = coreness.get(node.id);
      if (rawCommunity !== undefined) {
        const idx = remap.get(rawCommunity)!;
        node.community = idx;
        node.color = palette.get(idx);
      }
    }

    return { palette, communityCount: communitySet.size };
  },
};
