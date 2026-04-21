/**
 * Graph analytics module.
 * Acts as a central dispatcher for the graph algorithms.
 */

import type { GraphData, GraphNode, AnalyticsResult, GlobalAlgorithm, LocalAlgorithm } from './types.js';
import { LOCAL_ALGORITHMS, GLOBAL_ALGORITHMS } from './algorithms/index.js';

/**
 * Gets the representative of a community, defined as the node with the highest degree in that community.
 */
export function getCommunityRepresentative(data: GraphData, communityId: number): GraphNode | null {
	let maxDegree = -1;
	let representative: GraphNode | null = null;
	
	const degrees = new Map<string, number>();
	for (const link of data.links) {
		const src = typeof link.source === 'object' ? (link.source as GraphNode).id : link.source;
		const tgt = typeof link.target === 'object' ? (link.target as GraphNode).id : link.target;
		degrees.set(src, (degrees.get(src) || 0) + 1);
		degrees.set(tgt, (degrees.get(tgt) || 0) + 1);
	}

	for (const node of data.nodes) {
		if (node.community === communityId) {
			const degree = degrees.get(node.id) || 0;
			if (degree > maxDegree) {
				maxDegree = degree;
				representative = node;
			}
		}
	}
	
	return representative;
}

export { LOCAL_ALGORITHMS, GLOBAL_ALGORITHMS };
