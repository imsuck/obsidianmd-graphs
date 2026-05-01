import type { MetricAlgorithm, GraphData, GraphNode } from "../../types.js";

export const DegreeMetric: MetricAlgorithm = {
    id: "degree",
    name: "Degree",
    description: "Node size proportional to number of links.",
    execute: (data: GraphData) => {
        const degreeCounts = new Map<string, number>();
        for (const link of data.links) {
            const src =
                typeof link.source === "object"
                    ? (link.source as GraphNode).id
                    : link.source;
            const tgt =
                typeof link.target === "object"
                    ? (link.target as GraphNode).id
                    : link.target;
            degreeCounts.set(src, (degreeCounts.get(src) ?? 0) + 1);
            degreeCounts.set(tgt, (degreeCounts.get(tgt) ?? 0) + 1);
        }
        const values = Array.from(degreeCounts.values());
        const maxDeg = values.length > 0 ? Math.max(...values) : 0;
        for (const node of data.nodes) {
            // lerp from 1 to 20^2 then sqrt down to 1 to 20
            const degree = degreeCounts.get(node.id) ?? 1;
            const normalized = (degree - 1) / (maxDeg - 1);
            const scaled = normalized * (20 * 20 - 1) + 1;
            node.val = Math.max(1, Math.sqrt(scaled));
        }
    },
};
