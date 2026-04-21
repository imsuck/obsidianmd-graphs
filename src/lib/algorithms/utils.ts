import Graph from 'graphology';
import type { GraphData, GraphNode, AnalyticsResult } from '../types.js';

/**
 * Build a graphology Graph instance from our GraphData.
 */
export function buildGraphologyGraph(data: GraphData): Graph {
	const graph = new Graph({ type: 'directed', allowSelfLoops: true });

	for (const node of data.nodes) {
		if (!graph.hasNode(node.id)) {
			graph.addNode(node.id, { name: node.name, type: node.type });
		}
	}

	for (const link of data.links) {
		const src = typeof link.source === 'object' ? (link.source as GraphNode).id : link.source;
		const tgt = typeof link.target === 'object' ? (link.target as GraphNode).id : link.target;
		if (graph.hasNode(src) && graph.hasNode(tgt) && !graph.hasEdge(src, tgt)) {
			graph.addEdge(src, tgt);
		}
	}

	return graph;
}

export function mapToSortedResults(scores: Map<string, number>, data: GraphData, selectedNodeId: string): AnalyticsResult[] {
	const nodeMap = new Map(data.nodes.map((n) => [n.id, n]));

	// Pre-calculate edges from selected node for the isLinked flag
	const linkedNodes = new Set<string>();
	for (const link of data.links) {
		const src = typeof link.source === 'object' ? (link.source as GraphNode).id : link.source;
		const tgt = typeof link.target === 'object' ? (link.target as GraphNode).id : link.target;
		if (src === selectedNodeId) linkedNodes.add(tgt);
		if (tgt === selectedNodeId) linkedNodes.add(src);
	}

	return [...scores.entries()]
		.map(([nodeId, score]) => ({
			nodeId,
			nodeName: nodeMap.get(nodeId)?.name ?? nodeId,
			score,
			isLinked: linkedNodes.has(nodeId)
		}))
		.sort((a, b) => b.score - a.score)
		.slice(0, 20); // top 20
}
