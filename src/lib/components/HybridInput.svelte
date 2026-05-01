<script lang="ts">
	let {
		label,
		value = $bindable(),
		min = 0,
		max = 100,
		step = 1,
		id,
		onchange
	}: {
		label: string;
		value: number;
		min?: number;
		max?: number;
		step?: number;
		id?: string;
		onchange?: () => void;
	} = $props();

	let mode = $state<"range" | "number">("range");

	function toggleMode() {
		mode = mode === "range" ? "number" : "range";
	}
</script>

<div class="hybrid-input">
	<div class="header">
		<label for={id}>
			{label}{mode === "range" ? `: ${value.toFixed(step < 1 ? 1 : 0)}` : ""}
		</label>
		<button
			class="mode-toggle"
			onclick={toggleMode}
			type="button"
			title="Switch to {mode === 'range' ? 'Number' : 'Slider'}"
		>
			{#if mode === "range"}
				<!-- Precise/Number Icon -->
				<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<line x1="4" y1="9" x2="20" y2="9"></line>
					<line x1="4" y1="15" x2="20" y2="15"></line>
					<line x1="10" y1="3" x2="8" y2="21"></line>
					<line x1="16" y1="3" x2="14" y2="21"></line>
				</svg>
			{:else}
				<!-- Slider Icon -->
				<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<line x1="4" y1="21" x2="4" y2="14"></line>
					<line x1="4" y1="10" x2="4" y2="3"></line>
					<line x1="12" y1="21" x2="12" y2="12"></line>
					<line x1="12" y1="8" x2="12" y2="3"></line>
					<line x1="20" y1="21" x2="20" y2="16"></line>
					<line x1="20" y1="12" x2="20" y2="3"></line>
					<line x1="2" y1="14" x2="6" y2="14"></line>
					<line x1="10" y1="8" x2="14" y2="8"></line>
					<line x1="18" y1="16" x2="22" y2="16"></line>
				</svg>
			{/if}
		</button>
	</div>

	<div class="input-container">
		{#if mode === "range"}
			<input
				{id}
				type="range"
				{min}
				{max}
				{step}
				bind:value
				{onchange}
			/>
		{:else}
			<input
				{id}
				type="number"
				{step}
				bind:value
				{onchange}
			/>
		{/if}
	</div>
</div>

<style>
	.hybrid-input {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-bottom: 12px;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	label {
		font-size: 12px;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.5);
		letter-spacing: 0.02em;
	}

	.mode-toggle {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.05);
		padding: 4px;
		color: rgba(255, 255, 255, 0.3);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		transition: all 0.2s;
	}

	.mode-toggle:hover {
		background: rgba(255, 255, 255, 0.08);
		color: rgba(255, 255, 255, 0.9);
		border-color: rgba(255, 255, 255, 0.1);
	}

	.input-container {
		height: 38px;
		display: flex;
		align-items: center;
	}

	input[type="range"] {
		width: 100%;
		height: 6px;
		background: rgba(255, 255, 255, 0.08);
		border-radius: 3px;
		appearance: none;
		outline: none;
		cursor: pointer;
		transition: background 0.2s;
	}

	input[type="range"]::-webkit-slider-thumb {
		appearance: none;
		width: 16px;
		height: 16px;
		background: #b4c3ff;
		border: 3px solid #1a1c2e;
		border-radius: 50%;
		box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.15);
		cursor: pointer;
		transition: transform 0.1s, background 0.2s;
	}

	input[type="range"]::-webkit-slider-thumb:hover {
		transform: scale(1.15);
		background: white;
	}

	input[type="number"] {
		width: 100%;
		height: 100%;
		padding: 0 12px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 10px;
		color: white;
		font-size: 13px;
		font-family: inherit;
		outline: none;
		box-sizing: border-box;
		transition: border-color 0.2s, box-shadow 0.2s;
	}

	input[type="number"]:focus {
		border-color: rgba(140, 160, 255, 0.4);
		box-shadow: 0 0 0 3px rgba(140, 160, 255, 0.1);
		background: rgba(255, 255, 255, 0.06);
	}

	/* Remove stepper arrows for a cleaner look if desired, or keep them */
	input[type="number"]::-webkit-inner-spin-button,
	input[type="number"]::-webkit-outer-spin-button {
		opacity: 1;
	}
</style>
