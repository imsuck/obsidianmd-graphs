import type { GlobalAlgorithm, GraphData } from "../../types.js";
import { buildGraphologyGraph, finalizeCommunityColors } from "../utils.js";

export const LabelPropagationAlgorithm: GlobalAlgorithm = {
    id: "label-propagation",
    name: "Label Propagation",
    description:
        "Fast community detection where nodes adopt the most common label among their neighbors.",
    execute: (data: GraphData, options: { maxIter?: number } = {}) => {
        const graph = buildGraphologyGraph(data);

        // Initialize each node with its own unique label
        const labels = new Map<string, number>();
        const nodes = graph.nodes();
        nodes.forEach((node: string, i: number) => labels.set(node, i));


        const maxIter = options.maxIter ?? 100;
        let iterations = 0;
        let changed = true;
        while (changed && iterations < maxIter) {
            changed = false;
            // Shuffle nodes to prevent oscillation
            const shuffledNodes = [...nodes].sort(() => Math.random() - 0.5);

            for (const node of shuffledNodes) {
                const neighbors = graph.neighbors(node);
                if (neighbors.length === 0) continue;

                const labelCounts = new Map<number, number>();
                let maxCount = 0;
                let bestLabel = labels.get(node)!;

                for (const neighbor of neighbors) {
                    const neighborLabel = labels.get(neighbor)!;
                    const count = (labelCounts.get(neighborLabel) || 0) + 1;
                    labelCounts.set(neighborLabel, count);

                    if (count > maxCount) {
                        maxCount = count;
                        bestLabel = neighborLabel;
                    } else if (count === maxCount && Math.random() > 0.5) {
                        // Break ties randomly
                        bestLabel = neighborLabel;
                    }
                }

                if (labels.get(node) !== bestLabel) {
                    labels.set(node, bestLabel);
                    changed = true;
                }
            }
            iterations++;
        }

        return finalizeCommunityColors(graph, data, labels);
    },
};
