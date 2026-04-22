<script lang="ts">
	import type { AnalyticsResult, GraphNode, GraphData } from "$lib/types.js";
	import { LOCAL_ALGORITHMS } from "$lib/algorithms/index.js";

	let {
		graphData,
		selectedNode,
		communityRepresentative,
		onClose,
		onNavigate,
	}: {
		graphData: GraphData;
		selectedNode: GraphNode | null;
		communityRepresentative: GraphNode | null;
		onClose: () => void;
		onNavigate: (nodeId: string) => void;
	} = $props();

	let activeAlgoId = $state<string>(LOCAL_ALGORITHMS[0].id);
	let activeAlgo = $derived(
		LOCAL_ALGORITHMS.find((a) => a.id === activeAlgoId) ||
			LOCAL_ALGORITHMS[0],
	);
	let results = $derived(
		selectedNode && graphData
			? activeAlgo.execute(graphData, selectedNode.id)
			: [],
	);
</script>

{#if selectedNode}
	<div class="popup">
		<div class="popup-header">
			<div class="node-info">
				<span
					class="node-type-badge"
					class:tag={selectedNode.type === "tag"}
					class:unresolved={selectedNode.type === "unresolved"}
				>
					{selectedNode.type}
				</span>
				<h3 class="node-name">{selectedNode.name}</h3>
				<h5 class="node-value">Value: {selectedNode.val.toFixed(2)}</h5>
				{#if communityRepresentative && communityRepresentative.id !== selectedNode.id}
					<button
						class="representative"
						onclick={() => onNavigate(communityRepresentative!.id)}
					>
						Rep: {communityRepresentative.name}
					</button>
				{/if}
			</div>
			<button
				class="close-btn"
				onclick={onClose}
				aria-label="Close popup"
			>
				<svg
					width="14"
					height="14"
					viewBox="0 0 14 14"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M1 1l12 12M13 1L1 13" />
				</svg>
			</button>
		</div>

		<div class="dropdown-container">
			<select
				class="algo-select"
				bind:value={activeAlgoId}
				title={activeAlgo?.description}
			>
				{#each LOCAL_ALGORITHMS as algo}
					<option value={algo.id}>{algo.name}</option>
				{/each}
			</select>
		</div>

		<div class="results">
			{#if results.length === 0}
				<p class="empty">No related nodes found</p>
			{:else}
				{#each results as result, i}
					<button
						class="result-row"
						onclick={() => onNavigate(result.nodeId)}
					>
						<span class="rank">#{i + 1}</span>
						<span
							class="result-name"
							class:unresolved={result.nodeType === "unresolved"}
						>
							{#if result.isLinked}
								<span class="link-icon" title="Already linked"
									>🔗</span
								>
							{/if}
							{result.nodeName}
						</span>
						<span class="result-score"
							>{result.score.toFixed(3)}</span
						>
					</button>
				{/each}
			{/if}
		</div>
	</div>
{/if}

<style>
	.popup {
		position: absolute;
		top: 16px;
		right: 16px;
		width: 320px;
		max-height: 480px;
		background: rgba(15, 17, 30, 0.8);
		-webkit-backdrop-filter: blur(24px);
		backdrop-filter: blur(24px);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 16px;
		z-index: 100;
		display: flex;
		flex-direction: column;
		animation: slideIn 0.25s ease-out;
	}
	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateX(20px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}
	.popup-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: 16px 16px 12px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}
	.node-info {
		flex: 1;
		min-width: 0;
	}
	.node-type-badge {
		display: inline-block;
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		padding: 2px 8px;
		border-radius: 6px;
		background: rgba(140, 160, 255, 0.15);
		color: rgba(180, 195, 255, 0.9);
		margin-bottom: 6px;
	}
	.node-type-badge.tag {
		background: rgba(100, 220, 160, 0.15);
		color: rgba(140, 240, 180, 0.9);
	}
	.node-type-badge.unresolved {
		background: rgba(255, 180, 100, 0.15);
		color: rgba(255, 200, 140, 0.9);
	}
	.node-name {
		font-size: 15px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.node-value {
		color: rgba(255, 255, 255, 0.85);
		margin: 10px 0;
	}
	.representative {
		display: inline-block;
		margin-top: 4px;
		font-size: 11px;
		font-weight: 500;
		color: rgba(140, 160, 255, 0.9);
		background: rgba(140, 160, 255, 0.1);
		border: 1px solid rgba(140, 160, 255, 0.2);
		border-radius: 4px;
		padding: 2px 6px;
		cursor: pointer;
		font-family: "Inter", sans-serif;
		text-align: left;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		transition: all 0.2s;
	}
	.representative:hover {
		background: rgba(140, 160, 255, 0.2);
		border-color: rgba(140, 160, 255, 0.35);
		color: rgba(180, 195, 255, 1);
	}
	.close-btn {
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		color: rgba(255, 255, 255, 0.5);
		cursor: pointer;
		flex-shrink: 0;
		transition: all 0.2s;
	}
	.close-btn:hover {
		background: rgba(255, 100, 100, 0.15);
		border-color: rgba(255, 100, 100, 0.3);
		color: rgba(255, 150, 150, 0.9);
	}
	.dropdown-container {
		padding: 8px 16px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}
	.algo-select {
		width: 100%;
		padding: 8px 12px;
		font-size: 13px;
		font-weight: 500;
		font-family: "Inter", sans-serif;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		color: rgba(255, 255, 255, 0.9);
		cursor: pointer;
		outline: none;
		transition: all 0.2s;
		appearance: none;
		/* Custom arrow */
		background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22rgba(255,255,255,0.5)%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E");
		background-repeat: no-repeat;
		background-position: right 12px center;
		padding-right: 32px;
	}
	.algo-select:hover {
		background-color: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.2);
	}
	.algo-select:focus {
		border-color: rgba(140, 160, 255, 0.6);
		box-shadow: 0 0 0 2px rgba(140, 160, 255, 0.15);
	}
	.algo-select option {
		background: #1a1c2a;
		color: rgba(255, 255, 255, 0.9);
	}
	.results {
		flex: 1;
		overflow-y: auto;
		padding: 8px;
	}
	.empty {
		text-align: center;
		color: rgba(255, 255, 255, 0.25);
		font-size: 13px;
		padding: 24px 16px;
		font-style: italic;
	}
	.result-row {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		padding: 10px 12px;
		background: none;
		border: none;
		border-radius: 10px;
		color: white;
		cursor: pointer;
		font-family: "Inter", sans-serif;
		text-align: left;
		transition: background 0.15s;
	}
	.result-row:hover {
		background: rgba(255, 255, 255, 0.06);
	}
	.rank {
		font-size: 11px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.25);
		width: 24px;
		flex-shrink: 0;
	}
	.result-name {
		flex: 1;
		font-size: 13px;
		color: rgba(255, 255, 255, 0.8);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.result-name.unresolved {
		opacity: 0.5;
	}
	.result-score {
		font-size: 12px;
		font-weight: 600;
		color: rgba(140, 160, 255, 0.7);
		font-variant-numeric: tabular-nums;
		flex-shrink: 0;
	}
	.link-icon {
		font-size: 12px;
		margin-left: 4px;
		opacity: 0.8;
	}
</style>
