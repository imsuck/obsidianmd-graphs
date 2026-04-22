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

export function mixColorsNeighbor(
	graph: Graph,
	node: GraphNode,
	palette: Map<number, string>,
	nodeMap: Map<string, GraphNode>
) {
	if (node.community === undefined) return;

	const selfColor = palette.get(node.community);
	if (!selfColor) return;

	const neighbors = graph.neighbors(node.id);

	const alpha = 0.8;
	const beta = 1.0;
	const selfWeight = alpha + beta * (node.val ?? 1);

	const colorsWithWeights = [{ color: selfColor, weight: selfWeight }];

	for (const neighborId of neighbors) {
		const neighbor = nodeMap.get(neighborId);
		if (neighbor && neighbor.community !== undefined) {
			const neighborColor = palette.get(neighbor.community);
			if (neighborColor) {
				colorsWithWeights.push({ color: neighborColor, weight: 1.0 });
			}
		}
	}

	node.color = mixOKLCHColors(colorsWithWeights);
}

function parseOKLCH(s: string) {
	const match = s.match(/oklch\(([\d.-]+) ([\d.-]+) ([\d.-]+)\)/);
	if (!match) return { l: 0.5, c: 0.1, h: 0 };
	return {
		l: parseFloat(match[1]),
		c: parseFloat(match[2]),
		h: parseFloat(match[3])
	};
}

function formatOKLCH(l: number, c: number, h: number) {
	return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`;
}

function mixOKLCHColors(colorsWithWeights: { color: string; weight: number }[]) {
	let totalL = 0;
	let totalC = 0;
	let totalX = 0;
	let totalY = 0;
	let totalW = 0;

	for (const { color, weight } of colorsWithWeights) {
		const { l, c, h } = parseOKLCH(color);
		totalL += l * weight;
		totalC += c * weight;

		const rad = (h * Math.PI) / 180;
		totalX += Math.cos(rad) * weight;
		totalY += Math.sin(rad) * weight;

		totalW += weight;
	}

	if (totalW === 0) return 'oklch(0.5 0 0)';

	const l = totalL / totalW;
	const c = totalC / totalW;
	const h = (Math.atan2(totalY, totalX) * 180) / Math.PI;

	return formatOKLCH(l, c, (h + 360) % 360);
}
