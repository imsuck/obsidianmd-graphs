import eigenvector from "graphology-metrics/centrality/eigenvector";
import type { MetricAlgorithm, GraphData } from "../../types.js";
import { buildGraphologyGraph } from "../utils.js";

export const EigenvectorMetric: MetricAlgorithm = {
    id: "eigenvector",
    name: "Eigenvector Centrality",
    description: "Measures node importance based on eigenvector centrality.",
    execute: (data: GraphData) => {
        if (data.nodes.length === 0) return;
        const graph = buildGraphologyGraph(data);

        let scores: { [key: string]: number };
        try {
            scores = eigenvector(graph, {
                maxIterations: 500,
                tolerance: 1e-6,
                getEdgeWeight: undefined,
            });
        } catch (e) {
            console.warn(
                "Eigenvector centrality failed to converge, falling back to 0 scores:",
                e,
            );
            scores = {};
            for (const node of data.nodes) {
                scores[node.id] = 0;
            }
        }

        const values = Object.values(scores);
        const maxScore = values.length > 0 ? Math.max(...values) : 0;

        for (const node of data.nodes) {
            const score = scores[node.id] || 0;
            // Scale to 1..20 range for visibility
            node.val = maxScore > 0 ? (score / maxScore) * 19 + 1 : 1;
        }
    },
};
