<script lang="ts">
	import { untrack } from "svelte";
	import ForceGraph from "$lib/components/ForceGraph.svelte";
	import SettingsPanel from "$lib/components/SettingsPanel.svelte";
	import AnalyticsPopup from "$lib/components/AnalyticsPopup.svelte";
	import {
		runCommunityAnalysis,
		runMetricAnalysis,
		clearCommunityAnalysis
	} from "$lib/algorithms-applier.js";
	import type { GraphData, GraphNode, LayoutMode } from "$lib/types.js";
	import { applySpectralLayout } from "$lib/layouts/spectral-layout.js";
	import { applyNode2VecLayout } from "$lib/layouts/node2vec-layout.js";
	import { settings } from "$lib/settings.svelte.js";

	let loading = $state(false);
	let globalEnabled = $state(false);
	let errorMsg = $state("");

	let graphData = $state<GraphData>({ nodes: [], links: [] });
	let selectedNode = $state<GraphNode | null>(null);
	let communityCount = $state(0);

	let forceGraphRef: ForceGraph | undefined = $state();
	let palette = $state<Map<number, string>>();
	let communityRepresentatives = $state(new Map<number, GraphNode>());

	$effect(() => {
		settings.save();
	});

	async function loadVault() {
		if (!settings.vaultPath) return;
		loading = true;
		errorMsg = "";
		selectedNode = null;
		globalEnabled = false;
		communityCount = 0;
		settings.blendCommunities = false;

		try {
			const params = new URLSearchParams({
				vault: settings.vaultPath,
				linkMode: settings.linkMode,
				tagMode: settings.tagMode,
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
			if (settings.layoutMode === "spectral" || settings.layoutMode === "node2vec") await applyLayout();
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
		if (settings.blendCommunities !== undefined && globalEnabled) {
			untrack(() => {
				reapplyColors();
			});
		}
	});

	function applyGlobal() {
		let options: any = {};
		if (settings.globalAlgorithmId === "louvain") {
			options.resolution = settings.louvainResolution;
		} else if (settings.globalAlgorithmId === "spectral-clustering") {
			options.k = settings.spectralK;
		}

		const result = runCommunityAnalysis(
			graphData,
			settings.globalAlgorithmId,
			options,
			settings.blendCommunities
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
		runMetricAnalysis(graphData, settings.metricId);
		if (globalEnabled) reapplyColors();
		else graphData = { ...graphData };
	}

	async function applyLayout() {
		if (settings.layoutMode === "spectral") {
			applySpectralLayout(graphData, window.innerWidth, window.innerHeight, {
				scale: settings.spectralScale,
				aspectRatio: settings.spectralAspectRatio
			});
			graphData = { 
				nodes: [...graphData.nodes], 
				links: [...graphData.links] 
			};
		} else if (settings.layoutMode === "node2vec") {
			loading = true;
			try {
				await applyNode2VecLayout(graphData, window.innerWidth, window.innerHeight, {
					p: settings.node2vecP,
					q: settings.node2vecQ,
					iterations: settings.node2vecIterations,
					walkLength: settings.node2vecWalkLength,
					scale: settings.spectralScale, // Re-use spectral scale for simplicity
					aspectRatio: settings.spectralAspectRatio
				});
				graphData = { 
					nodes: [...graphData.nodes], 
					links: [...graphData.links] 
				};
			} catch (e) {
				console.error("Node2Vec layout failed:", e);
				errorMsg = "Node2Vec layout failed";
			} finally {
				loading = false;
			}
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
			showArrows={settings.showArrows}
			layoutMode={settings.layoutMode}
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
		bind:vaultPath={settings.vaultPath}
		bind:linkMode={settings.linkMode}
		bind:tagMode={settings.tagMode}
		bind:showArrows={settings.showArrows}
		bind:globalEnabled
		bind:globalAlgorithmId={settings.globalAlgorithmId}
		bind:louvainResolution={settings.louvainResolution}
		bind:metricId={settings.metricId}
		bind:blendCommunities={settings.blendCommunities}
		bind:layoutMode={settings.layoutMode}
		bind:spectralK={settings.spectralK}
		bind:spectralScale={settings.spectralScale}
		bind:spectralAspectRatio={settings.spectralAspectRatio}
		bind:node2vecP={settings.node2vecP}
		bind:node2vecQ={settings.node2vecQ}
		bind:node2vecIterations={settings.node2vecIterations}
		bind:node2vecWalkLength={settings.node2vecWalkLength}
		bind:collapsed={settings.collapsed}
		bind:activeTab={settings.activeTab}
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
