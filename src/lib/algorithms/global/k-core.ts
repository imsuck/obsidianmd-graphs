import type { GlobalAlgorithm, GraphData } from "../../types.js";
import { buildGraphologyGraph, finalizeCommunityColors } from "../utils.js";

export const KCoreAlgorithm: GlobalAlgorithm = {
    id: "k-core",
    name: "K-Core Decomposition",
    description:
        "Partitions the graph into cores based on degrees. A k-core is a maximal subgraph where all nodes have degree at least k.",
    execute: (data: GraphData) => {
        const graph = buildGraphologyGraph(data);

        const deg = new Map<string, number>();
        const nodes = graph.nodes();
        nodes.forEach((node: string) => deg.set(node, graph.degree(node)));

        const coreness = new Map<string, number>();
        let k = 0;
        let remaining = nodes.length;

        while (remaining > 0) {
            let removedThisIter = true;

            while (removedThisIter) {
                removedThisIter = false;
                for (const node of nodes) {
                    if (!coreness.has(node) && deg.get(node)! <= k) {
                        coreness.set(node, k);
                        remaining--;
                        removedThisIter = true;

                        // Decrease degree of neighbors
                        for (const neighbor of graph.neighbors(node)) {
                            if (!coreness.has(neighbor)) {
                                deg.set(neighbor, deg.get(neighbor)! - 1);
                            }
                        }
                    }
                }
            }
            k++;
        }

        return finalizeCommunityColors(graph, data, coreness);
    },
};
