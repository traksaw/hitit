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
			event.dataTransfer.setData('application/json', JSON.stringify({
				clip,
				trackNumber
			}));
		}
	}

	function handleDragEnd() {
		isDragging = false;
	}
</script>

<div
	class="track-row flex items-center h-24 border-b border-lime-light transition-colors group {isDragging ? 'opacity-50 bg-lime-medium' : 'bg-lime-lighter hover:bg-lime-light/50'}"
	draggable="true"
	on:dragstart={handleDragStart}
	on:dragend={handleDragEnd}
	role="button"
	tabindex="0"
>
	<!-- Track Number & Color -->
	<div class="w-12 h-full flex items-center justify-center bg-lime-base text-white font-bold">
		{trackNumber}
	</div>

	<!-- Track Controls -->
	<div class="track-controls flex items-center gap-2 w-64 px-4 bg-lime-lighter/80">
		<!-- Mute -->
		<button
			class="w-8 h-8 rounded {isMuted
				? 'bg-gray-500'
				: 'bg-lime-base hover:bg-lime-medium'} text-white text-xs font-bold transition-colors"
			on:click={toggleMute}
			title="Mute"
		>
			M
		</button>

		<!-- Solo -->
		<button
			class="w-8 h-8 rounded {isSolo
				? 'bg-yellow-500'
				: 'bg-lime-base hover:bg-lime-medium'} text-white text-xs font-bold transition-colors"
			on:click={toggleSolo}
			title="Solo"
		>
			S
		</button>

		<!-- Volume Fader -->
		<div class="flex flex-col items-center flex-1">
			<input
				type="range"
				min="0"
				max="1"
				step="0.01"
				bind:value={volume}
				on:input={handleVolumeChange}
				class="w-full accent-lime-base"
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
				class="w-16 accent-lime-base"
				title="Pan"
			/>
			<span class="text-xs text-gray-600">{pan === 0 ? 'C' : pan > 0 ? `R${Math.abs(pan).toFixed(1)}` : `L${Math.abs(pan).toFixed(1)}`}</span>
		</div>
	</div>

	<!-- Clip Info & Waveform Preview -->
	<div class="flex-1 px-4 flex items-center gap-3">
		<div class="flex-1">
			<p class="font-semibold text-gray-800 text-sm">{clip.title}</p>
			{#if clip.description}
				<p class="text-xs text-gray-600 truncate">{clip.description}</p>
			{/if}
		</div>

		<!-- Mini Waveform Visualization -->
		<div class="w-32 h-12 bg-lime-darkest/20 rounded relative overflow-hidden">
			<div class="absolute inset-0 flex items-center justify-center">
				{#each Array(20).fill(0) as value, waveIdx (waveIdx)}
					<div
						class="w-1 bg-lime-base mx-px"
						style="height: {Math.random() * 100}%"
					></div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Effects Chain (Hidden, shown on hover) -->
	<div class="effects-chain opacity-0 group-hover:opacity-100 transition-opacity px-4 flex gap-2">
		<button
			class="px-3 py-1 bg-lime-dark text-white text-xs rounded hover:bg-lime-medium transition-colors"
			title="EQ"
		>
			EQ
		</button>
		<button
			class="px-3 py-1 bg-lime-dark text-white text-xs rounded hover:bg-lime-medium transition-colors"
			title="Reverb"
		>
			REV
		</button>
		<button
			class="px-3 py-1 bg-lime-dark text-white text-xs rounded hover:bg-lime-medium transition-colors"
			title="Delay"
		>
			DLY
		</button>
	</div>
</div>
