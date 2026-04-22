import type { GlobalAlgorithm, GraphData } from '../../types.js';
import { buildGraphologyGraph } from '../utils.js';
import louvain from 'graphology-communities-louvain';
import { generateCommunityPalette } from '../../oklch-palette.js';

export const LouvainAlgorithm: GlobalAlgorithm = {
	id: 'louvain',
	name: 'Louvain Communities',
	description: 'Detects communities by maximizing modularity. Groups densely connected nodes together.',
	execute: (data: GraphData, options?: any) => {
		const resolution = options?.resolution ?? 1.0;
		const graph = buildGraphologyGraph(data);

		const communities = louvain(graph, { resolution });

		// Find the number of distinct communities
		const communitySet = new Set(Object.values(communities));
		const palette = generateCommunityPalette(communitySet.size);

		// Remap community IDs to 0..n-1 for palette indexing
		const uniqueCommunities = [...communitySet];
		const remap = new Map<number, number>();
		uniqueCommunities.forEach((c, i) => remap.set(c, i));

		// Assign to nodes
		for (const node of data.nodes) {
			const rawCommunity = communities[node.id];
			if (rawCommunity === undefined) continue;
			const idx = remap.get(rawCommunity)!;
			node.community = idx;
			node.color = palette.get(idx);
		}

		return { palette, communityCount: communitySet.size };
	}
};
