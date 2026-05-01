import type {
    LocalAlgorithm,
    GraphData,
    AnalyticsResult,
} from "../../types.js";
import { buildGraphologyGraph, mapToSortedResults } from "../utils.js";

export const ClusteringCoefficientAlgorithm: LocalAlgorithm = {
    id: "clustering-coefficient",
    name: "Clustering Coefficient",
    description:
        "Measures how tightly knit a node's neighborhood is. High score means a node's neighbors are also connected to each other.",
    execute: (data: GraphData, selectedNodeId: string): AnalyticsResult[] => {
        const graph = buildGraphologyGraph(data);

        if (!graph.hasNode(selectedNodeId)) return [];

        const scores = new Map<string, number>();

        // Calculate local clustering coefficient for each node
        graph.forEachNode((nodeId) => {
            const neighbors = graph.neighbors(nodeId);
            const degree = neighbors.length;

            if (degree < 2) {
                scores.set(nodeId, 0);
                return;
            }

            let linksBetweenNeighbors = 0;
            for (let i = 0; i < degree; i++) {
                for (let j = i + 1; j < degree; j++) {
                    if (graph.hasEdge(neighbors[i], neighbors[j])) {
                        linksBetweenNeighbors++;
                    }
                }
            }

            const maxPossibleLinks = (degree * (degree - 1)) / 2;
            scores.set(nodeId, linksBetweenNeighbors / maxPossibleLinks);
        });

        return mapToSortedResults(scores, data, selectedNodeId);
    },
};
