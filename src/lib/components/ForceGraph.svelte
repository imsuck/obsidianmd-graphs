<script lang="ts">
    import * as d3 from "d3";
    import { onMount, untrack } from "svelte";
    import type { GraphData, GraphNode, LayoutMode } from "$lib/types.js";
    import {
        getNodeBaseColor,
        getNodeAlpha,
        getLinkAlpha,
        getNodeLabel,
        getNodeSize,
    } from "$lib/graph-styles.js";

    let {
        graphData,
        showArrows = true,
        layoutMode = "force",
        globalEnabled = false,
        communityRepresentatives = new Map(),
        selectedNode = $bindable(null),
        onNodeClick,
        onBackgroundClick,
    }: {
        graphData: GraphData;
        showArrows?: boolean;
        layoutMode?: LayoutMode;
        globalEnabled?: boolean;
        communityRepresentatives?: Map<number, GraphNode>;
        selectedNode?: GraphNode | null;
        onNodeClick: (node: GraphNode) => void;
        onBackgroundClick: () => void;
    } = $props();

    let container: HTMLDivElement;
    let graph: any = $state(null);
    let ForceGraphModule: any = $state(null);

    // Derived config for style functions
    let styleConfig = $derived({
        selectedNode,
        globalEnabled,
        communityRepresentatives,
    });

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
            .nodeLabel((node: GraphNode) => getNodeLabel(node, styleConfig))
            .nodeColor((node: GraphNode) => getNodeBaseColor(node))
            .nodeVal((node: GraphNode) => getNodeSize(node))
            .nodeCanvasObject(
                (
                    node: any,
                    ctx: CanvasRenderingContext2D,
                    globalScale: number,
                ) => {
                    const size = Math.sqrt(getNodeSize(node)) * 3;
                    const color = getNodeBaseColor(node);
                    const alpha = getNodeAlpha(node, styleConfig);

                    if (size * globalScale < 1) return;

                    ctx.save();
                    ctx.globalAlpha = alpha;

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
                    ctx.restore();
                },
            )
            .nodePointerAreaPaint(
                (node: any, color: string, ctx: CanvasRenderingContext2D) => {
                    const size = (node.val ?? 1) + 3;
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, size + 2, 0, 2 * Math.PI);
                    ctx.fillStyle = color;
                    ctx.fill();
                },
            )
            .linkColor((link: any) => {
                const alpha = getLinkAlpha(link, styleConfig);
                return `rgba(120, 140, 200, ${alpha})`;
            })
            .linkWidth((link: any) => {
                const alpha = getLinkAlpha(link, styleConfig);
                return alpha > 0.1 ? 0.5 : 0.2;
            })
            .linkDirectionalArrowLength(showArrows ? 3.5 : 0)
            .linkDirectionalArrowRelPos(1)
            .onNodeClick((node: GraphNode) => {
                onNodeClick(node);
                zoomToNode(node);
            })
            .onBackgroundClick(() => {
                onBackgroundClick();
            })
            .warmupTicks(0)
            .cooldownTicks(3600) // How long after mouse release until pausing simulation
            .d3AlphaDecay(0.04)
            .d3VelocityDecay(0.4)
            .graphData(graphData);

        updateForces();

        // Handle window resize
        const resizeObserver = new ResizeObserver(() => {
            if (graph && container) {
                graph.width(container.clientWidth);
                graph.height(container.clientHeight);
            }
        });
        resizeObserver.observe(container);
    }

    function updateForces() {
        if (!graph) return;

        if (layoutMode === "spectral" || layoutMode === "node2vec") {
            // Disable forces for static layout
            graph.d3Force("charge", null);
            graph.d3Force("link", null);
            graph.d3Force("x", null);
            graph.d3Force("y", null);
            graph.d3Force("collide", null);
            // Re-apply data to ensure fx/fy are respected
            graph.graphData(graphData);
        } else {
            // Restore default forces
            graph.d3Force(
                "charge",
                d3.forceManyBody().strength(-100).theta(1.3),
            );
            graph.d3Force("link", d3.forceLink().distance(50));
            graph.d3Force("x", d3.forceX().strength(0.05));
            graph.d3Force("y", d3.forceY().strength(0.05));
            graph.d3Force("collide", d3.forceCollide().radius(20));
            // Reset fixed positions if switching back to force
            graphData.nodes.forEach((n) => {
                n.fx = undefined;
                n.fy = undefined;
            });
            graph.graphData(graphData);
            graph.d3ReheatSimulation();
        }
    }

    let lastNodes: any[] = [];
    let lastLinks: any[] = [];

    // React to graphData, showArrows, layoutMode, and selectedNode changes
    $effect(() => {
        if (graph && graphData) {
            const nodesChanged = graphData.nodes !== lastNodes;
            const linksChanged = graphData.links !== lastLinks;

            if (nodesChanged || linksChanged) {
                graph.graphData(graphData);
                lastNodes = graphData.nodes;
                lastLinks = graphData.links;
            } else {
                // Force a refresh of the canvas for style changes (like highlight)
                graph.zoom(graph.zoom(), 0);
            }
            graph.linkDirectionalArrowLength(showArrows ? 3.5 : 0);
        }
    });

    // Trigger refresh when style-impacting state changes
    $effect(() => {
        if (
            graph &&
            (selectedNode || !selectedNode || globalEnabled || !globalEnabled)
        ) {
            graph.zoom(graph.zoom(), 0);
        }
    });

    $effect(() => {
        if (graph && layoutMode) {
            untrack(() => updateForces());
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
