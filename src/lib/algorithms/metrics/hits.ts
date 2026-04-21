import hits from 'graphology-metrics/centrality/hits';
import type { MetricAlgorithm, GraphData } from '../../types.js';
import { buildGraphologyGraph } from '../utils.js';

export const HITSHubsMetric: MetricAlgorithm = {
	id: 'hits-hubs',
	name: 'HITS - Hubs',
	description: 'Nodes that link to many authorities.',
	execute: (data: GraphData) => {
		if (data.nodes.length === 0) return;
		const graph = buildGraphologyGraph(data);
		const { hubs } = hits(graph);

		const values = Object.values(hubs);
		const maxScore = values.length > 0 ? Math.max(...values) : 0;

		for (const node of data.nodes) {
			const score = hubs[node.id] || 0;
			node.val = maxScore > 0 ? (score / maxScore) * 19 + 1 : 1;
		}
	}
};

export const HITSAuthoritiesMetric: MetricAlgorithm = {
	id: 'hits-authorities',
	name: 'HITS - Authorities',
	description: 'Nodes that are linked by many hubs.',
	execute: (data: GraphData) => {
		if (data.nodes.length === 0) return;
		const graph = buildGraphologyGraph(data);
		const { authorities } = hits(graph);

		const values = Object.values(authorities);
		const maxScore = values.length > 0 ? Math.max(...values) : 0;

		for (const node of data.nodes) {
			const score = authorities[node.id] || 0;
			node.val = maxScore > 0 ? (score / maxScore) * 19 + 1 : 1;
		}
	}
};
