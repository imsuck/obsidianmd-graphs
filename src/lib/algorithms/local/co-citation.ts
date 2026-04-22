import type {
  LocalAlgorithm,
  GraphData,
  AnalyticsResult,
} from "../../types.js";
import { buildGraphologyGraph, mapToSortedResults } from "../utils.js";

export const CoCitationAlgorithm: LocalAlgorithm = {
  id: "cocitation",
  name: "Co-citation",
  description:
    "Ranks nodes by how many shared in-neighbors they have with the selected node. Two notes are similar if many notes link to both.",
  execute: (data: GraphData, selectedNodeId: string): AnalyticsResult[] => {
    const graph = buildGraphologyGraph(data);

    if (!graph.hasNode(selectedNodeId)) return [];

    const selectedNeighbors = new Set(graph.neighbors(selectedNodeId));
    const scores = new Map<string, number>();

    // For every other node, count shared neighbors
    graph.forEachNode((nodeId) => {
      if (nodeId === selectedNodeId) return;

      const nodeNeighbors = graph.neighbors(nodeId);
      let shared = 0;
      for (const n of nodeNeighbors) {
        if (selectedNeighbors.has(n)) shared++;
      }

      if (shared > 0) {
        scores.set(nodeId, shared);
      }
    });

    return mapToSortedResults(scores, data, selectedNodeId);
  },
};
