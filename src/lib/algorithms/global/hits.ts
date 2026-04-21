import type { GlobalAlgorithm, GraphData } from '../../types.js';
import { buildGraphologyGraph } from '../utils.js';
import { generateCommunityPalette } from '../../oklch-palette.js';

export const HITSAlgorithm: GlobalAlgorithm = {
	id: 'hits',
	name: 'HITS (Hubs & Authorities)',
	description: 'Assigns nodes to "Hubs" (link to many authorities) or "Authorities" (linked by many hubs) based on score parity.',
	execute: (data: GraphData, options?: any) => {
		const graph = buildGraphologyGraph(data);
		const nodes = graph.nodes();

		let hubs = new Map<string, number>();
		let auths = new Map<string, number>();

		nodes.forEach((node: string) => {
			hubs.set(node, 1);
			auths.set(node, 1);
		});

		const maxIterations = 20;
		for (let i = 0; i < maxIterations; i++) {
			let normAuth = 0;
			let normHub = 0;
			const newAuths = new Map<string, number>();
			const newHubs = new Map<string, number>();

			// For undirected graph, in-neighbors and out-neighbors are the same.
			// HITS on undirected graph basically converges to Eigenvector Centrality for both.
			for (const node of nodes) {
				let authScore = 0;
				let hubScore = 0;
				for (const neighbor of graph.neighbors(node)) {
					authScore += hubs.get(neighbor)!;
					hubScore += auths.get(neighbor)!;
				}
				newAuths.set(node, authScore);
				newHubs.set(node, hubScore);
				normAuth += authScore * authScore;
				normHub += hubScore * hubScore;
			}

			normAuth = Math.sqrt(normAuth);
			normHub = Math.sqrt(normHub);

			for (const node of nodes) {
				auths.set(node, normAuth > 0 ? newAuths.get(node)! / normAuth : 0);
				hubs.set(node, normHub > 0 ? newHubs.get(node)! / normHub : 0);
			}
		}

		// Since our graph is undirected, hubs and authorities are identical.
		// We'll group nodes into percentiles/bins to visualize as communities.
		const scores = [...auths.values()].sort((a, b) => a - b);

		// Create bins based on score
		const numBins = options?.numBins ?? 5;
		const binThresholds = [];
		for (let i = 1; i < numBins; i++) {
			binThresholds.push(scores[Math.floor(scores.length * (i / numBins))]);
		}

		const palette = generateCommunityPalette(numBins);

		for (const node of data.nodes) {
			const score = auths.get(node.id) || 0;
			let bin = 0;
			for (let i = 0; i < binThresholds.length; i++) {
				if (score > binThresholds[i]) bin = i + 1;
			}

			node.community = bin;
			node.color = palette.get(bin);
		}

		return { palette, communityCount: numBins };
	}
};
