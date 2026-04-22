import type { GlobalAlgorithm, GraphData } from "../../types.js";
import { buildGraphologyGraph, finalizeCommunityColors } from "../utils.js";
import louvain from "graphology-communities-louvain";

export const LouvainAlgorithm: GlobalAlgorithm = {
  id: "louvain",
  name: "Louvain Communities",
  description:
    "Detects communities by maximizing modularity. Groups densely connected nodes together.",
  execute: (data: GraphData, options?: any) => {
    const resolution = options?.resolution ?? 1.0;
    const graph = buildGraphologyGraph(data);

    const communities = louvain(graph, { resolution });

    return finalizeCommunityColors(graph, data, communities);
  },
};
