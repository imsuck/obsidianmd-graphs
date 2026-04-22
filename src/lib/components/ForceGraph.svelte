<script lang="ts">
	import * as d3 from "d3";
	import { onMount } from "svelte";
	import type { GraphData, GraphNode } from "$lib/types.js";

	let {
		graphData,
		showArrows = true,
		onNodeClick,
		onBackgroundClick,
	}: {
		graphData: GraphData;
		showArrows?: boolean;
		onNodeClick: (node: GraphNode) => void;
		onBackgroundClick: () => void;
	} = $props();

	let container: HTMLDivElement;
	let graph: any = $state(null);
	let ForceGraphModule: any = $state(null);

	onMount(() => {
		// Dynamic import since force-graph uses browser APIs
		import("force-graph").then((mod) => {
			ForceGraphModule = mod.default;
			initGraph();
		});

		return () => {
			if (graph) {
				graph._destructor?.();
				graph = null;
			}
		};
	});

	function initGraph() {
		if (!ForceGraphModule || !container) return;

		graph = ForceGraphModule()(container)
			.backgroundColor("#0a0a1a")
			.nodeLabel((node: GraphNode) => {
				const label = node.name;
				const typeLabel =
					node.type === "tag"
						? " (tag)"
						: node.type === "unresolved"
							? " (unresolved)"
							: "";
				return `${label}${typeLabel}`;
			})
			.nodeColor((node: GraphNode) => {
				if (node.color) return node.color;
				switch (node.type) {
					case "tag":
						return "oklch(0.78 0.18 160)";
					case "unresolved":
						return "oklch(0.55 0.05 250)";
					default:
						return "oklch(0.75 0.14 260)";
				}
			})
			.nodeVal((node: GraphNode) => {
				const base = node.val ?? 1;
				if (node.type === "tag") return Math.max(base * 0.6, 0.5);
				return base;
			})
			.nodeCanvasObject(
				(
					node: any,
					ctx: CanvasRenderingContext2D,
					globalScale: number,
				) => {
					const size = Math.sqrt(node.val ?? 1) * 3;
					const color =
						node.color ??
						(node.type === "tag"
							? "oklch(0.78 0.18 160)"
							: node.type === "unresolved"
								? "oklch(0.55 0.05 250)"
								: "oklch(0.75 0.14 260)");

					if (size * globalScale < 1) return;

					// Node circle
					ctx.beginPath();
					ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
					ctx.fillStyle = color;
					ctx.fill();

					// Label when zoomed in
					if (globalScale >= 1.5) {
						const label = node.name;
						const fontSize = Math.max(11 / globalScale, 1.5);
						ctx.font = `${fontSize}px Inter, sans-serif`;
						ctx.textAlign = "center";
						ctx.textBaseline = "top";
						ctx.fillStyle = "rgba(225, 232, 240, 0.85)";
						ctx.fillText(label, node.x, node.y + size + 2);
					}
				},
			)
			.nodePointerAreaPaint(
				(node: any, color: string, ctx: CanvasRenderingContext2D) => {
					const size = Math.sqrt(node.val ?? 1) * 3;
					ctx.beginPath();
					ctx.arc(node.x, node.y, size + 2, 0, 2 * Math.PI);
					ctx.fillStyle = color;
					ctx.fill();
				},
			)
			.linkColor(() => "rgba(120, 140, 200, 0.5)")
			.linkWidth(0.5)
			.linkDirectionalArrowLength(showArrows ? 3.5 : 0)
			.linkDirectionalArrowRelPos(1)
			.onNodeClick((node: GraphNode) => {
				onNodeClick(node);
				zoomToNode(node);
			})
			.onBackgroundClick(() => {
				onBackgroundClick();
			})
			.warmupTicks(50)
			.cooldownTicks(200)
			.d3AlphaDecay(0.05)
			.d3VelocityDecay(0.6)
			.graphData(graphData);

		// Tweak default forces to pull nodes closer together
		graph.d3Force("charge").strength(-100).theta(1.0).distanceMax(1000);
		graph.d3Force("link").distance(75);
		graph.d3Force("x", d3.forceX().strength(0.1));
		graph.d3Force("y", d3.forceY().strength(0.1));
		graph.d3Force("collide", d3.forceCollide().radius(23));

		// Handle window resize
		const resizeObserver = new ResizeObserver(() => {
			if (graph && container) {
				graph.width(container.clientWidth);
				graph.height(container.clientHeight);
			}
		});
		resizeObserver.observe(container);
	}

	let lastNodes: any[] = [];
	let lastLinks: any[] = [];

	// React to graphData and showArrows changes
	$effect(() => {
		if (graph && graphData) {
			const nodesChanged = graphData.nodes !== lastNodes;
			const linksChanged = graphData.links !== lastLinks;

			if (nodesChanged || linksChanged) {
				graph.graphData(graphData);
				lastNodes = graphData.nodes;
				lastLinks = graphData.links;
			} else {
				// Only attributes (color, size) changed.
				// Since nodeCanvasObject reads directly from node objects,
				// we just need to trigger a single frame redraw if the simulation is paused.
				// A zero-duration zoom to the current level is a safe way to trigger a repaint in 2D force-graph.
				graph.zoom(graph.zoom(), 0);
			}
			graph.linkDirectionalArrowLength(showArrows ? 3.5 : 0);
		}
	});

	/**
	 * Zoom camera to a specific node (called from parent)
	 */
	export function zoomToNode(node: GraphNode) {
		if (!graph) return;
		graph.centerAt(node.x, node.y, 800);
		graph.zoom(4, 800);
	}
</script>

<div class="graph-container" bind:this={container}></div>

<style>
	.graph-container {
		width: 100%;
		height: 100%;
		position: absolute;
		inset: 0;
	}

	.graph-container :global(canvas) {
		outline: none;
	}
</style>
