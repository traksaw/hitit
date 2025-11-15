<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Clip } from '$lib/api';

	export let clip: Clip;
	export let trackNumber: number;

	let isMuted = false;
	let isSolo = false;
	let volume = 0.8;
	let pan = 0; // -1 (left) to 1 (right)

	const dispatch = createEventDispatcher();

	function toggleMute() {
		isMuted = !isMuted;
		dispatch('mute', { trackNumber, isMuted });
	}

	function toggleSolo() {
		isSolo = !isSolo;
		dispatch('solo', { trackNumber, isSolo });
	}

	function handleVolumeChange() {
		dispatch('volumeChange', { trackNumber, volume });
	}

	function handlePanChange() {
		dispatch('panChange', { trackNumber, pan });
	}

	// Drag and drop handlers
	let isDragging = false;

	function handleDragStart(event: DragEvent) {
		isDragging = true;
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData(
				'application/json',
				JSON.stringify({
					clip,
					trackNumber
				})
			);
		}
	}

	function handleDragEnd() {
		isDragging = false;
	}
</script>

<div
	class="track-row border-lime-light group flex h-24 items-center border-b transition-colors {isDragging
		? 'bg-lime-medium opacity-50'
		: 'bg-lime-lighter hover:bg-lime-light/50'}"
	draggable="true"
	on:dragstart={handleDragStart}
	on:dragend={handleDragEnd}
	role="button"
	tabindex="0"
>
	<!-- Track Number & Color -->
	<div class="bg-lime-base flex h-full w-12 items-center justify-center font-bold text-white">
		{trackNumber}
	</div>

	<!-- Track Controls -->
	<div class="track-controls bg-lime-lighter/80 flex w-64 items-center gap-2 px-4">
		<!-- Mute -->
		<button
			class="h-8 w-8 rounded {isMuted
				? 'bg-gray-500'
				: 'bg-lime-base hover:bg-lime-medium'} text-xs font-bold text-white transition-colors"
			on:click={toggleMute}
			title="Mute"
		>
			M
		</button>

		<!-- Solo -->
		<button
			class="h-8 w-8 rounded {isSolo
				? 'bg-yellow-500'
				: 'bg-lime-base hover:bg-lime-medium'} text-xs font-bold text-white transition-colors"
			on:click={toggleSolo}
			title="Solo"
		>
			S
		</button>

		<!-- Volume Fader -->
		<div class="flex flex-1 flex-col items-center">
			<input
				type="range"
				min="0"
				max="1"
				step="0.01"
				bind:value={volume}
				on:input={handleVolumeChange}
				class="accent-lime-base w-full"
				title="Volume"
			/>
			<span class="text-xs text-gray-600">{Math.round(volume * 100)}%</span>
		</div>

		<!-- Pan Knob -->
		<div class="flex flex-col items-center">
			<input
				type="range"
				min="-1"
				max="1"
				step="0.1"
				bind:value={pan}
				on:input={handlePanChange}
				class="accent-lime-base w-16"
				title="Pan"
			/>
			<span class="text-xs text-gray-600"
				>{pan === 0
					? 'C'
					: pan > 0
						? `R${Math.abs(pan).toFixed(1)}`
						: `L${Math.abs(pan).toFixed(1)}`}</span
			>
		</div>
	</div>

	<!-- Clip Info & Waveform Preview -->
	<div class="flex flex-1 items-center gap-3 px-4">
		<div class="flex-1">
			<p class="text-sm font-semibold text-gray-800">{clip.title}</p>
			{#if clip.description}
				<p class="truncate text-xs text-gray-600">{clip.description}</p>
			{/if}
		</div>

		<!-- Mini Waveform Visualization -->
		<div class="bg-lime-darkest/20 relative h-12 w-32 overflow-hidden rounded">
			<div class="absolute inset-0 flex items-center justify-center">
				<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
				{#each Array(20).fill(0) as _, waveIdx (waveIdx)}
					<div class="bg-lime-base mx-px w-1" style="height: {Math.random() * 100}%"></div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Effects Chain (Hidden, shown on hover) -->
	<div class="effects-chain flex gap-2 px-4 opacity-0 transition-opacity group-hover:opacity-100">
		<button
			class="bg-lime-dark hover:bg-lime-medium rounded px-3 py-1 text-xs text-white transition-colors"
			title="EQ"
		>
			EQ
		</button>
		<button
			class="bg-lime-dark hover:bg-lime-medium rounded px-3 py-1 text-xs text-white transition-colors"
			title="Reverb"
		>
			REV
		</button>
		<button
			class="bg-lime-dark hover:bg-lime-medium rounded px-3 py-1 text-xs text-white transition-colors"
			title="Delay"
		>
			DLY
		</button>
	</div>
</div>
