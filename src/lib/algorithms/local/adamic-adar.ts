import type { LocalAlgorithm, GraphData, AnalyticsResult } from '../../types.js';
import { buildGraphologyGraph, mapToSortedResults } from '../utils.js';

export const AdamicAdarAlgorithm: LocalAlgorithm = {
	id: 'adamicadar',
	name: 'Adamic-Adar',
	description: 'Weights rare shared neighbors higher. Score = Σ 1/log(degree(u)) for each common neighbor u.',
	execute: (data: GraphData, selectedNodeId: string): AnalyticsResult[] => {
		const graph = buildGraphologyGraph(data);

		if (!graph.hasNode(selectedNodeId)) return [];

		const selectedNeighbors = new Set(graph.neighbors(selectedNodeId));
		const scores = new Map<string, number>();

		graph.forEachNode((nodeId) => {
			if (nodeId === selectedNodeId) return;

			const nodeNeighbors = graph.neighbors(nodeId);
			let score = 0;
			for (const n of nodeNeighbors) {
				if (selectedNeighbors.has(n)) {
					const degree = graph.degree(n);
					if (degree > 1) {
						score += 1 / Math.log(degree);
					}
				}
			}

			if (score > 0) {
				scores.set(nodeId, score);
			}
		});

		return mapToSortedResults(scores, data, selectedNodeId);
	}
};
