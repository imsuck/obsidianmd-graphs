import pagerank from "graphology-metrics/centrality/pagerank";
import type { MetricAlgorithm, GraphData } from "../../types.js";
import { buildGraphologyGraph } from "../utils.js";

export const PageRankMetric: MetricAlgorithm = {
  id: "pagerank",
  name: "PageRank",
  description: "Measures node importance based on link structure.",
  execute: (data: GraphData) => {
    if (data.nodes.length === 0) return;
    const graph = buildGraphologyGraph(data);
    const scores = pagerank(graph);

    const values = Object.values(scores);
    const maxScore = values.length > 0 ? Math.max(...values) : 0;

    for (const node of data.nodes) {
      const score = scores[node.id] || 0;
      // Scale to 1..20 range for visibility
      node.val = maxScore > 0 ? (score / maxScore) * 19 + 1 : 1;
    }
  },
};
