import { GLOBAL_ALGORITHMS, METRIC_ALGORITHMS, getAllCommunityRepresentatives } from "./analytics";
import { buildGraphologyGraph, diffuseColors } from "./algorithms/utils";
import type { GraphData, GraphNode } from "./types";

export interface CommunityResult {
	palette: Map<number, string>;
	communityCount: number;
	representatives: Map<number, GraphNode>;
}

export function runCommunityAnalysis(
	graphData: GraphData,
	algorithmId: string,
	options: any,
	blendCommunities: boolean
): CommunityResult | null {
	const algo = GLOBAL_ALGORITHMS.find((a) => a.id === algorithmId);
	if (!algo) return null;

	const { palette, communityCount } = algo.execute(graphData, options);

	// Reset colors and apply community colors
	for (const node of graphData.nodes) {
		if (node.community !== undefined) {
			node.color = palette.get(node.community);
		} else {
			node.color = undefined;
		}
	}

	// Optional color diffusion
	if (blendCommunities) {
		const g = buildGraphologyGraph(graphData);
		diffuseColors(g, graphData, palette);
	}

	const representatives = getAllCommunityRepresentatives(graphData);

	return { palette, communityCount, representatives };
}

export function runMetricAnalysis(
	graphData: GraphData,
	metricId: string
): void {
	const algo = METRIC_ALGORITHMS.find((a) => a.id === metricId);
	if (!algo) return;

	algo.execute(graphData);
}

export function clearCommunityAnalysis(graphData: GraphData): void {
	for (const node of graphData.nodes) {
		node.community = undefined;
		node.color = undefined;
	}
}
