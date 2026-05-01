<script lang="ts">
	import { untrack } from "svelte";
	import ForceGraph from "$lib/components/ForceGraph.svelte";
	import SettingsPanel from "$lib/components/SettingsPanel.svelte";
	import AnalyticsPopup from "$lib/components/AnalyticsPopup.svelte";
	import {
		GLOBAL_ALGORITHMS,
		METRIC_ALGORITHMS,
	} from "$lib/analytics.js";
	import {
		runCommunityAnalysis,
		runMetricAnalysis,
		clearCommunityAnalysis
	} from "$lib/algorithms-applier.js";
	import type { GraphData, GraphNode, LayoutMode } from "$lib/types.js";
	import { applySpectralLayout } from "$lib/layouts/spectral-layout.js";
	import { applyNode2VecLayout } from "$lib/layouts/node2vec-layout.js";

	let vaultPath = $state("");
	let linkMode = $state<"auto" | "absolute" | "relative">("auto");
	let tagMode = $state<"flat" | "hierarchical">("flat");
	let loading = $state(false);
	let globalEnabled = $state(false);
	let globalAlgorithmId = $state(GLOBAL_ALGORITHMS[0].id);
	let louvainResolution = $state(1.0);
	let spectralK = $state(5);
	let spectralScale = $state(1.0);
	let spectralAspectRatio = $state(1.0);
	let node2vecP = $state(1.0);
	let node2vecQ = $state(1.0);
	let node2vecIterations = $state(5);
	let node2vecWalkLength = $state(20);
	let metricId = $state(METRIC_ALGORITHMS[0].id);
	let layoutMode = $state<LayoutMode>("force");
	let showArrows = $state(true);
	let errorMsg = $state("");

	let graphData = $state<GraphData>({ nodes: [], links: [] });
	let selectedNode = $state<GraphNode | null>(null);
	let communityCount = $state(0);
	let blendCommunities = $state(true);

	let forceGraphRef: ForceGraph | undefined = $state();
	let palette = $state<Map<number, string>>();
	let communityRepresentatives = $state(new Map<number, GraphNode>());

	async function loadVault() {
		if (!vaultPath) return;
		loading = true;
		errorMsg = "";
		selectedNode = null;
		globalEnabled = false;
		communityCount = 0;
		blendCommunities = true;

		try {
			const params = new URLSearchParams({
				vault: vaultPath,
				linkMode,
				tagMode,
			});
			const res = await fetch(`/api/graph?${params}`);
			if (!res.ok) {
				const body = await res
					.json()
					.catch(() => ({ message: res.statusText }));
				throw new Error(body.message || `HTTP ${res.status}`);
			}
			graphData = await res.json();
			applyMetric();
			if (layoutMode === "spectral" || layoutMode === "node2vec") applyLayout();
		} catch (e: unknown) {
			errorMsg = e instanceof Error ? e.message : "Failed to load vault";
			graphData = { nodes: [], links: [] };
		} finally {
			loading = false;
		}
	}

	let communityRepresentative = $state<GraphNode | null>(null);

	function handleNodeClick(node: GraphNode) {
		selectedNode = node;

		if (globalEnabled && node.community !== undefined) {
			communityRepresentative = communityRepresentatives.get(node.community) || null;
		} else {
			communityRepresentative = null;
		}
	}

	function handleBackgroundClick() {
		selectedNode = null;
	}

	function handleClosePopup() {
		selectedNode = null;
	}

	function handleNavigate(nodeId: string) {
		const node = graphData.nodes.find((n) => n.id === nodeId);
		if (node && forceGraphRef) {
			forceGraphRef.zoomToNode(node);
			handleNodeClick(node);
		}
	}

	function toggleGlobal() {
		if (globalEnabled) {
			clearCommunityAnalysis(graphData);
			palette = undefined;
			communityCount = 0;
			globalEnabled = false;
			communityRepresentative = null;
			communityRepresentatives = new Map();
			graphData = { ...graphData };
		} else {
			applyGlobal();
		}
	}

	function reapplyColors() {
		if (!globalEnabled) return;
		applyGlobal();
	}

	$effect(() => {
		if (blendCommunities !== undefined && globalEnabled) {
			untrack(() => {
				reapplyColors();
			});
		}
	});

	function applyGlobal() {
		let options: any = {};
		if (globalAlgorithmId === "louvain") {
			options.resolution = louvainResolution;
		} else if (globalAlgorithmId === "spectral-clustering") {
			options.k = spectralK;
		}

		const result = runCommunityAnalysis(
			graphData,
			globalAlgorithmId,
			options,
			blendCommunities
		);

		if (result) {
			palette = result.palette;
			communityCount = result.communityCount;
			communityRepresentatives = result.representatives;
			globalEnabled = true;
			graphData = { ...graphData };

			if (selectedNode) {
				handleNodeClick(selectedNode);
			}
		}
	}

	function applyMetric() {
		runMetricAnalysis(graphData, metricId);
		if (globalEnabled) reapplyColors();
		else graphData = { ...graphData };
	}

	function applyLayout() {
		if (layoutMode === "spectral") {
			applySpectralLayout(graphData, window.innerWidth, window.innerHeight, {
				scale: spectralScale,
				aspectRatio: spectralAspectRatio
			});
			graphData = { 
				nodes: [...graphData.nodes], 
				links: [...graphData.links] 
			};
		} else if (layoutMode === "node2vec") {
			applyNode2VecLayout(graphData, window.innerWidth, window.innerHeight, {
				p: node2vecP,
				q: node2vecQ,
				iterations: node2vecIterations,
				walkLength: node2vecWalkLength,
				scale: spectralScale, // Re-use spectral scale for simplicity
				aspectRatio: spectralAspectRatio
			});
			graphData = { 
				nodes: [...graphData.nodes], 
				links: [...graphData.links] 
			};
		} else {
			graphData = { 
				nodes: [...graphData.nodes], 
				links: [...graphData.links] 
			};
		}
	}
</script>

<svelte:head>
	<title>Obsidian Graph Visualizer</title>
	<meta
		name="description"
		content="2D graph visualization and analytics for Obsidian vaults"
	/>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link
		rel="preconnect"
		href="https://fonts.gstatic.com"
		crossorigin="anonymous"
	/>
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<main id="app-root">
	{#if graphData.nodes.length > 0}
		<ForceGraph
			bind:this={forceGraphRef}
			{graphData}
			{showArrows}
			{layoutMode}
			{globalEnabled}
			{communityRepresentatives}
			bind:selectedNode
			onNodeClick={handleNodeClick}
			onBackgroundClick={handleBackgroundClick}
		/>
	{:else if !loading}
		<div class="empty-state">
			<div class="empty-icon">
				<svg
					width="64"
					height="64"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.2"
				>
					<circle cx="12" cy="12" r="2" /><circle
						cx="5"
						cy="7"
						r="1.5"
					/>
					<circle cx="19" cy="7" r="1.5" /><circle
						cx="5"
						cy="17"
						r="1.5"
					/>
					<circle cx="19" cy="17" r="1.5" />
					<path
						d="M7 8l3 3M14 9l3-1M7 16l3-3M14 15l3 1"
						stroke-dasharray="2 2"
					/>
				</svg>
			</div>
			<h1>Obsidian Graph Visualizer</h1>
			<p>
				Enter your vault path in the settings panel to visualize your
				knowledge graph.
			</p>
		</div>
	{/if}

	<SettingsPanel
		bind:vaultPath
		bind:linkMode
		bind:tagMode
		bind:showArrows
		bind:globalEnabled
		bind:globalAlgorithmId
		bind:louvainResolution
		bind:metricId
		bind:blendCommunities
		bind:layoutMode
		bind:spectralK
		bind:spectralScale
		bind:spectralAspectRatio
		bind:node2vecP
		bind:node2vecQ
		bind:node2vecIterations
		bind:node2vecWalkLength
		{loading}
		nodeCount={graphData.nodes.length}
		linkCount={graphData.links.length}
		{communityCount}
		onLoadVault={loadVault}
		onToggleGlobal={toggleGlobal}
		onApplyGlobal={applyGlobal}
		onApplyMetric={applyMetric}
		onApplyLayout={applyLayout}
	/>

	<AnalyticsPopup
		{graphData}
		{selectedNode}
		{communityRepresentative}
		onClose={handleClosePopup}
		onNavigate={handleNavigate}
	/>

	{#if errorMsg}
		<div class="error-toast">
			<svg
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
			</svg>
			{errorMsg}
			<button onclick={() => (errorMsg = "")}>✕</button>
		</div>
	{/if}
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		overflow: hidden;
		background: #0a0a1a;
		font-family:
			"Inter",
			-apple-system,
			BlinkMacSystemFont,
			sans-serif;
		color: white;
		-webkit-font-smoothing: antialiased;
	}

	#app-root {
		width: 100vw;
		height: 100vh;
		position: relative;
	}

	.empty-state {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 40px;
		background: radial-gradient(
			ellipse at center,
			rgba(60, 70, 140, 0.08) 0%,
			transparent 70%
		);
	}

	.empty-icon {
		color: rgba(140, 160, 255, 0.3);
		margin-bottom: 24px;
		animation: float 4s ease-in-out infinite;
	}

	@keyframes float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px);
		}
	}

	.empty-state h1 {
		font-size: 28px;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.85);
		margin: 0 0 12px;
		letter-spacing: -0.02em;
	}

	.empty-state p {
		font-size: 15px;
		color: rgba(255, 255, 255, 0.35);
		max-width: 400px;
		line-height: 1.6;
		margin: 0;
	}

	.error-toast {
		position: absolute;
		bottom: 24px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 20px;
		background: rgba(220, 60, 60, 0.15);
		backdrop-filter: blur(16px);
		border: 1px solid rgba(220, 60, 60, 0.3);
		border-radius: 12px;
		color: rgba(255, 170, 170, 0.95);
		font-size: 13px;
		z-index: 200;
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(16px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}

	.error-toast button {
		background: none;
		border: none;
		color: rgba(255, 170, 170, 0.6);
		cursor: pointer;
		font-size: 14px;
		padding: 2px 6px;
	}

	.error-toast button:hover {
		color: white;
	}
</style>
