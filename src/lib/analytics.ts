/**
 * Graph analytics module.
 * Acts as a central dispatcher for the graph algorithms.
 */

import type {
  GraphData,
  GraphNode,
  AnalyticsResult,
  GlobalAlgorithm,
  LocalAlgorithm,
  MetricAlgorithm,
} from "./types.js";
import {
  LOCAL_ALGORITHMS,
  GLOBAL_ALGORITHMS,
  METRIC_ALGORITHMS,
} from "./algorithms/index.js";

/**
 * Gets the representative of a community, defined as the node with the highest degree in that community.
 */
export function getCommunityRepresentative(
  data: GraphData,
  communityId: number,
): GraphNode | null {
  const reps = getAllCommunityRepresentatives(data);
  return reps.get(communityId) || null;
}

/**
 * Gets the representatives of all communities.
 */
export function getAllCommunityRepresentatives(
  data: GraphData,
): Map<number, GraphNode> {
  const reps = new Map<number, GraphNode>();
  const maxValues = new Map<number, number>();

  // Use node.val if available, otherwise fallback to degrees
  const hasValues = data.nodes.some((n) => n.val !== undefined);
  const degrees = new Map<string, number>();

  if (!hasValues) {
    for (const link of data.links) {
      const src = typeof link.source === "object" ? (link.source as any).id : link.source;
      const tgt = typeof link.target === "object" ? (link.target as any).id : link.target;
      degrees.set(src, (degrees.get(src) || 0) + 1);
      degrees.set(tgt, (degrees.get(tgt) || 0) + 1);
    }
  }

  for (const node of data.nodes) {
    if (node.community !== undefined) {
      const val = node.val ?? degrees.get(node.id) ?? 0;
      const currentMax = maxValues.get(node.community) ?? -Infinity;

      if (val > currentMax) {
        maxValues.set(node.community, val);
        reps.set(node.community, node);
      }
    }
  }

  return reps;
}

export { LOCAL_ALGORITHMS, GLOBAL_ALGORITHMS, METRIC_ALGORITHMS };
