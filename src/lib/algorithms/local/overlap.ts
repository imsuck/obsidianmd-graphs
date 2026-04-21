import type { LocalAlgorithm, GraphData, AnalyticsResult } from '../../types.js';
import { buildGraphologyGraph, mapToSortedResults } from '../utils.js';

export const OverlapAlgorithm: LocalAlgorithm = {
	id: 'overlap',
	name: 'Overlap Coefficient',
	description: 'Measures similarity by dividing shared neighbors by the smaller degree of the two nodes. Good for finding sub-topics.',
	execute: (data: GraphData, selectedNodeId: string): AnalyticsResult[] => {
		const graph = buildGraphologyGraph(data);

		if (!graph.hasNode(selectedNodeId)) return [];

		const selectedNeighbors = new Set(graph.neighbors(selectedNodeId));
		const selectedDegree = selectedNeighbors.size;
		const scores = new Map<string, number>();

		graph.forEachNode((nodeId) => {
			if (nodeId === selectedNodeId) return;

			const nodeNeighbors = graph.neighbors(nodeId);
			let shared = 0;
			for (const n of nodeNeighbors) {
				if (selectedNeighbors.has(n)) shared++;
			}

			if (shared > 0) {
				const minDegree = Math.min(selectedDegree, nodeNeighbors.length);
				if (minDegree > 0) {
					scores.set(nodeId, shared / minDegree);
				}
			}
		});

		return mapToSortedResults(scores, data, selectedNodeId);
	}
};
