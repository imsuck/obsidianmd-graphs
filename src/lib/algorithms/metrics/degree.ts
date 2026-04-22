import type { MetricAlgorithm, GraphData, GraphNode } from '../../types.js';

export const DegreeMetric: MetricAlgorithm = {
	id: 'degree',
	name: 'Degree',
	description: 'Node size proportional to number of links.',
	execute: (data: GraphData) => {
		const degreeCounts = new Map<string, number>();
		for (const link of data.links) {
			const src = typeof link.source === 'object' ? (link.source as GraphNode).id : link.source;
			const tgt = typeof link.target === 'object' ? (link.target as GraphNode).id : link.target;
			degreeCounts.set(src, (degreeCounts.get(src) ?? 0) + 1);
			degreeCounts.set(tgt, (degreeCounts.get(tgt) ?? 0) + 1);
		}
		for (const node of data.nodes) {
			node.val = Math.max(1, Math.sqrt(degreeCounts.get(node.id) ?? 1));
		}
	}
};
