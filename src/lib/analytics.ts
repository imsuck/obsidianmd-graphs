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
  const maxDegrees = new Map<number, number>();

  const degrees = new Map<string, number>();
  for (const link of data.links) {
    const src =
      typeof link.source === "object"
        ? (link.source as GraphNode).id
        : link.source;
    const tgt =
      typeof link.target === "object"
        ? (link.target as GraphNode).id
        : link.target;
    degrees.set(src, (degrees.get(src) || 0) + 1);
    degrees.set(tgt, (degrees.get(tgt) || 0) + 1);
  }

  for (const node of data.nodes) {
    if (node.community !== undefined) {
      const degree = degrees.get(node.id) || 0;
      const currentMax = maxDegrees.get(node.community) ?? -1;
      if (degree > currentMax) {
        maxDegrees.set(node.community, degree);
        reps.set(node.community, node);
      }
    }
  }

  return reps;
}

export { LOCAL_ALGORITHMS, GLOBAL_ALGORITHMS, METRIC_ALGORITHMS };
