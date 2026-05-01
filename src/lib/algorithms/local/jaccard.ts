import type {
    LocalAlgorithm,
    GraphData,
    AnalyticsResult,
} from "../../types.js";
import { buildGraphologyGraph, mapToSortedResults } from "../utils.js";

export const JaccardAlgorithm: LocalAlgorithm = {
    id: "jaccard",
    name: "Jaccard Similarity",
    description:
        "Measures the similarity of two nodes by dividing their shared neighbors by their total unique neighbors.",
    execute: (data: GraphData, selectedNodeId: string): AnalyticsResult[] => {
        const graph = buildGraphologyGraph(data);

        if (!graph.hasNode(selectedNodeId)) return [];

        const selectedNeighbors = new Set(graph.neighbors(selectedNodeId));
        const scores = new Map<string, number>();

        graph.forEachNode((nodeId) => {
            if (nodeId === selectedNodeId) return;

            const nodeNeighbors = graph.neighbors(nodeId);
            let shared = 0;
            for (const n of nodeNeighbors) {
                if (selectedNeighbors.has(n)) shared++;
            }

            if (shared > 0) {
                const totalUnique =
                    selectedNeighbors.size + nodeNeighbors.length - shared;
                scores.set(nodeId, shared / totalUnique);
            }
        });

        return mapToSortedResults(scores, data, selectedNodeId);
    },
};
