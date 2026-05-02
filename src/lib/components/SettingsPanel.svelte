<script lang="ts">
	import {
		GLOBAL_ALGORITHMS,
		METRIC_ALGORITHMS,
	} from "$lib/algorithms/index.js";
	import HybridInput from "./HybridInput.svelte";

	let {
		vaultPath = $bindable(""),
		linkMode = $bindable("auto" as "auto" | "absolute" | "relative"),
		tagMode = $bindable("flat" as "flat" | "hierarchical"),
		showArrows = $bindable(true),
		globalEnabled = $bindable(false),
		globalAlgorithmId = $bindable(""),
		louvainResolution = $bindable(1.0),
		metricId = $bindable(""),
		layoutMode = $bindable("force" as "force" | "spectral"),
		loading,
		nodeCount,
		linkCount,
		communityCount,
		blendCommunities = $bindable(false),
		spectralK = $bindable(5),
		spectralScale = $bindable(1.0),
		spectralAspectRatio = $bindable(1.0),
		node2vecP = $bindable(1.0),
		node2vecQ = $bindable(1.0),
		node2vecIterations = $bindable(5),
		node2vecWalkLength = $bindable(20),
		collapsed = $bindable(false),
		activeTab = $bindable("project" as "project" | "analytics"),
		onLoadVault,
		onToggleGlobal,
		onApplyGlobal,
		onApplyMetric,
		onApplyLayout,
	}: {
		vaultPath: string;
		linkMode: "auto" | "absolute" | "relative";
		tagMode: "flat" | "hierarchical";
		showArrows: boolean;
		globalEnabled: boolean;
		globalAlgorithmId: string;
		louvainResolution: number;
		metricId: string;
		layoutMode: "force" | "spectral" | "node2vec";
		loading: boolean;
		nodeCount: number;
		linkCount: number;
		communityCount: number;
		blendCommunities: boolean;
		spectralK: number;
		spectralScale: number;
		spectralAspectRatio: number;
		node2vecP: number;
		node2vecQ: number;
		node2vecIterations: number;
		node2vecWalkLength: number;
		collapsed: boolean;
		activeTab: "project" | "analytics";
		onLoadVault: () => void;
		onToggleGlobal: () => void;
		onApplyGlobal: () => void;
		onApplyMetric: () => void;
		onApplyLayout: () => void;
	} = $props();
</script>

<div class="settings-panel" class:collapsed>
	<button
		class="toggle-btn"
		onclick={() => (collapsed = !collapsed)}
		aria-label="Toggle settings"
	>
		{#if collapsed}
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none"
				><path
					d="M6 3L11 8L6 13"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				/></svg
			>
		{:else}
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none"
				><path
					d="M10 3L5 8L10 13"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				/></svg
			>
		{/if}
	</button>

	{#if !collapsed}
		<div class="panel-content">
			<h2 class="panel-title">Settings</h2>

			<div class="tabs">
				<button
					class="tab-btn"
					class:active={activeTab === "project"}
					onclick={() => (activeTab = "project")}>Project</button
				>
				<button
					class="tab-btn"
					class:active={activeTab === "analytics"}
					onclick={() => (activeTab = "analytics")}>Analytics</button
				>
			</div>

			<div class="tab-content">
				{#if activeTab === "project"}
					<div class="field">
						<label for="vault-path">Vault Path</label>
						<input
							id="vault-path"
							type="text"
							bind:value={vaultPath}
							placeholder="/path/to/obsidian/vault"
							onkeydown={(e: KeyboardEvent) => {
								if (e.key === "Enter") onLoadVault();
							}}
						/>
					</div>

					<div class="field">
						<label>Link Resolution</label>
						<div class="toggle-group">
							<button
								class:active={linkMode === "auto"}
								onclick={() => (linkMode = "auto")}>Auto</button
							>
							<button
								class:active={linkMode === "absolute"}
								onclick={() => (linkMode = "absolute")}
								>Absolute</button
							>
							<button
								class:active={linkMode === "relative"}
								onclick={() => (linkMode = "relative")}
								>Relative</button
							>
						</div>
					</div>

					<div class="field">
						<label>Tag Mode</label>
						<div class="toggle-group">
							<button
								class:active={tagMode === "flat"}
								onclick={() => (tagMode = "flat")}>Flat</button
							>
							<button
								class:active={tagMode === "hierarchical"}
								onclick={() => (tagMode = "hierarchical")}
								>Hierarchical</button
							>
						</div>
					</div>

					<div class="field">
						<label class="checkbox-label">
							<input type="checkbox" bind:checked={showArrows} />
							<span>Show Link Directions</span>
						</label>
					</div>

					<hr class="divider" />
					<h3 class="section-title">Layout Engine</h3>
					<div class="field">
						<div class="toggle-group">
							<button
								class:active={layoutMode === "force"}
								onclick={() => {
									layoutMode = "force";
									onApplyLayout();
								}}>Force</button
							>
							<button
								class:active={layoutMode === "spectral"}
								onclick={() => {
									layoutMode = "spectral";
									onApplyLayout();
								}}>Spectral</button
							>
							<button
								class:active={layoutMode === "node2vec"}
								onclick={() => {
									layoutMode = "node2vec";
									onApplyLayout();
								}}>Node2Vec</button
							>
						</div>
					</div>

					{#if layoutMode === "spectral"}
						<HybridInput
							id="spectral-scale"
							label="Layout Scale"
							min={0.1}
							max={3.0}
							step={0.1}
							bind:value={spectralScale}
							onchange={onApplyLayout}
						/>
						<HybridInput
							id="spectral-aspect"
							label="Aspect Ratio"
							min={0.1}
							max={3.0}
							step={0.1}
							bind:value={spectralAspectRatio}
							onchange={onApplyLayout}
						/>
					{/if}

					{#if layoutMode === "node2vec"}
						<div class="grid-2">
							<HybridInput
								id="n2v-p"
								label="P (Return)"
								min={0.1}
								max={5.0}
								step={0.1}
								bind:value={node2vecP}
								onchange={onApplyLayout}
							/>
							<HybridInput
								id="n2v-q"
								label="Q (In-Out)"
								min={0.1}
								max={5.0}
								step={0.1}
								bind:value={node2vecQ}
								onchange={onApplyLayout}
							/>
						</div>
						<HybridInput
							id="n2v-iter"
							label="Iterations"
							min={1}
							max={50}
							step={1}
							bind:value={node2vecIterations}
							onchange={onApplyLayout}
						/>
						<HybridInput
							id="n2v-walk"
							label="Walk Length"
							min={5}
							max={100}
							step={5}
							bind:value={node2vecWalkLength}
							onchange={onApplyLayout}
						/>
					{/if}

					<button
						class="load-btn"
						onclick={onLoadVault}
						disabled={loading || !vaultPath}
					>
						{#if loading}<span class="spinner"></span> Loading…{:else}Load
							Vault{/if}
					</button>
				{:else if activeTab === "analytics"}
					<h3 class="section-title">Node Radius</h3>
					<div class="field">
						<label>Centrality Metric</label>
						<select
							class="algo-select"
							bind:value={metricId}
							onchange={onApplyMetric}
						>
							{#each METRIC_ALGORITHMS as metric}
								<option
									value={metric.id}
									title={metric.description}
									>{metric.name}</option
								>
							{/each}
						</select>
					</div>

					<hr class="divider" />
					<h3 class="section-title">Global Analytics</h3>

					<div class="field">
						<label>Algorithm</label>
						<select
							class="algo-select"
							bind:value={globalAlgorithmId}
							onchange={() => {
								if (globalEnabled) onApplyGlobal();
							}}
						>
							{#each GLOBAL_ALGORITHMS as algo}
								<option value={algo.id} title={algo.description}
									>{algo.name}</option
								>
							{/each}
						</select>
					</div>

					<div class="field">
						<label class="checkbox-label">
							<input
								type="checkbox"
								bind:checked={blendCommunities}
							/>
							<span>Blend Communities</span>
						</label>
					</div>

					<button
						class="analytics-btn"
						class:active={globalEnabled}
						onclick={onToggleGlobal}
						disabled={nodeCount === 0}
					>
						{globalEnabled ? "Clear Analysis" : "Run Analysis"}
					</button>

					{#if globalAlgorithmId === "louvain"}
						<div style="margin-top: 12px;">
							<HybridInput
								id="resolution-slider"
								label="Resolution"
								min={0.1}
								max={5.0}
								step={0.1}
								bind:value={louvainResolution}
								onchange={() => {
									if (globalEnabled) onApplyGlobal();
								}}
							/>
						</div>
					{/if}

					{#if globalAlgorithmId === "spectral-clustering"}
						<div style="margin-top: 12px;">
							<HybridInput
								id="spectral-k-slider"
								label="Clusters (k)"
								min={2}
								max={20}
								step={1}
								bind:value={spectralK}
								onchange={() => {
									if (globalEnabled) onApplyGlobal();
								}}
							/>
						</div>
					{/if}
				{/if}
			</div>

			{#if nodeCount > 0}
				<hr class="divider" />
				<div class="stats">
					<div class="stat">
						<span class="stat-value">{nodeCount}</span><span
							class="stat-label">Nodes</span
						>
					</div>
					<div class="stat">
						<span class="stat-value">{linkCount}</span><span
							class="stat-label">Links</span
						>
					</div>
					{#if communityCount > 0}
						<div class="stat">
							<span class="stat-value">{communityCount}</span
							><span class="stat-label">Communities</span>
						</div>
					{/if}
				</div>
			{/if}

			<p class="hint">Click a node to see related notes</p>
		</div>
	{/if}
</div>

<style>
	.settings-panel {
		position: absolute;
		top: 16px;
		left: 16px;
		width: 300px;
		max-height: calc(100vh - 32px);
		overflow-y: auto;
		background: rgba(15, 17, 30, 0.75);
		-webkit-backdrop-filter: blur(24px);
		backdrop-filter: blur(24px);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 16px;
		z-index: 100;
		transition: width 0.3s ease;
	}
	.settings-panel.collapsed {
		width: 48px;
		height: 48px;
		overflow: hidden;
		background: none;
		border: none;
	}

	.toggle-btn {
		position: absolute;
		top: 12px;
		right: 12px;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		color: rgba(255, 255, 255, 0.6);
		cursor: pointer;
		transition: all 0.2s;
	}
	.collapsed .toggle-btn {
		top: 10px;
		right: 10px;
	}
	.toggle-btn:hover {
		background: rgba(255, 255, 255, 0.12);
		color: white;
	}

	.panel-content {
		padding: 20px;
	}

	.panel-title {
		font-size: 15px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
		margin: 0 0 16px;
		letter-spacing: 0.02em;
	}

	.tabs {
		display: flex;
		gap: 4px;
		margin-bottom: 20px;
		padding: 4px;
		background: rgba(255, 255, 255, 0.04);
		border-radius: 12px;
	}

	.tab-btn {
		flex: 1;
		padding: 8px;
		font-size: 12px;
		font-weight: 600;
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.4);
		cursor: pointer;
		border-radius: 8px;
		transition: all 0.2s;
	}

	.tab-btn.active {
		background: rgba(255, 255, 255, 0.08);
		color: white;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}

	.section-title {
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: rgba(255, 255, 255, 0.4);
		margin: 0 0 12px;
	}

	.field {
		margin-bottom: 16px;
	}
	.field label {
		display: block;
		font-size: 12px;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.5);
		margin-bottom: 6px;
		letter-spacing: 0.02em;
	}
	.field input,
	.field select {
		width: 100%;
		padding: 10px 12px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		color: white;
		font-size: 13px;
		font-family: "Inter", sans-serif;
		outline: none;
		box-sizing: border-box;
		transition:
			border-color 0.2s,
			box-shadow 0.2s;
	}
	.field input:focus,
	.field select:focus {
		border-color: rgba(140, 160, 255, 0.5);
		box-shadow: 0 0 0 3px rgba(140, 160, 255, 0.1);
	}
	.field input::placeholder {
		color: rgba(255, 255, 255, 0.2);
	}
	.field select {
		appearance: none;
		background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
		background-repeat: no-repeat;
		background-position: right 10px center;
		background-size: 14px;
		padding-right: 32px;
	}
	.field select option {
		background: #111322;
		color: white;
	}

	.toggle-group {
		display: flex;
		border-radius: 10px;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}
	.toggle-group button {
		flex: 1;
		padding: 8px 12px;
		font-size: 12px;
		font-weight: 500;
		font-family: "Inter", sans-serif;
		background: rgba(255, 255, 255, 0.03);
		border: none;
		color: rgba(255, 255, 255, 0.4);
		cursor: pointer;
		transition: all 0.2s;
	}
	.toggle-group button:not(:last-child) {
		border-right: 1px solid rgba(255, 255, 255, 0.08);
	}
	.toggle-group button.active {
		background: rgba(140, 160, 255, 0.15);
		color: rgba(180, 195, 255, 0.95);
	}
	.toggle-group button:hover:not(.active) {
		background: rgba(255, 255, 255, 0.06);
		color: rgba(255, 255, 255, 0.6);
	}

	.load-btn {
		width: 100%;
		padding: 11px 16px;
		background: linear-gradient(
			135deg,
			rgba(100, 120, 255, 0.25),
			rgba(140, 100, 255, 0.25)
		);
		border: 1px solid rgba(130, 140, 255, 0.25);
		border-radius: 10px;
		color: rgba(200, 210, 255, 0.95);
		font-size: 13px;
		font-weight: 600;
		font-family: "Inter", sans-serif;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		transition: all 0.2s;
	}
	.load-btn:hover:not(:disabled) {
		background: linear-gradient(
			135deg,
			rgba(100, 120, 255, 0.35),
			rgba(140, 100, 255, 0.35)
		);
		border-color: rgba(130, 140, 255, 0.4);
	}
	.load-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.analytics-btn {
		width: 100%;
		padding: 10px 16px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		color: rgba(255, 255, 255, 0.65);
		font-size: 13px;
		font-weight: 500;
		font-family: "Inter", sans-serif;
		cursor: pointer;
		transition: all 0.2s;
	}
	.analytics-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.08);
		color: white;
	}
	.analytics-btn.active {
		background: rgba(100, 220, 160, 0.12);
		border-color: rgba(100, 220, 160, 0.25);
		color: rgba(140, 240, 180, 0.95);
	}
	.analytics-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.divider {
		border: none;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
		margin: 16px 0;
	}

	.grid-2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}

	.stats {
		display: flex;
		gap: 12px;
	}
	.stat {
		flex: 1;
		text-align: center;
		padding: 10px 4px;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 10px;
	}
	.stat-value {
		display: block;
		font-size: 18px;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.85);
		font-variant-numeric: tabular-nums;
	}
	.stat-label {
		display: block;
		font-size: 10px;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: rgba(255, 255, 255, 0.35);
		margin-top: 2px;
	}

	.hint {
		margin: 16px 0 0;
		font-size: 11px;
		color: rgba(255, 255, 255, 0.25);
		line-height: 1.5;
		font-style: italic;
	}

	.checkbox-label {
		display: flex !important;
		align-items: center;
		gap: 10px;
		cursor: pointer;
		user-select: none;
		color: rgba(255, 255, 255, 0.7) !important;
		font-size: 13px !important;
	}

	.checkbox-label input {
		width: auto !important;
		margin: 0 !important;
		cursor: pointer;
	}

	.spinner {
		display: inline-block;
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-top-color: rgba(180, 195, 255, 0.8);
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
