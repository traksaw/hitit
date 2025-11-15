<script lang="ts">
	import { onMount } from 'svelte';
	import TrackRow from './TrackRow.svelte';
	import type { Clip } from '$lib/api';

	export let clips: Clip[] = [];
	export let bpm = 120;
	export let gridSnap = true;
	export let snapValue = 0.25; // Quarter note

	let zoom = 50; // pixels per second
	let playheadPosition = 0;
	let isPlaying = false;
	let duration = 60; // Total timeline duration in seconds

	// Generate time ruler ticks
	$: ticks = Array.from({ length: Math.ceil(duration) }, (_, i) => i);

	function togglePlay() {
		isPlaying = !isPlaying;
	}

	function handleZoomIn() {
		zoom = Math.min(zoom * 1.5, 200);
	}

	function handleZoomOut() {
		zoom = Math.max(zoom / 1.5, 20);
	}

	function handleTrackMute(event: CustomEvent) {
		console.log('Track muted:', event.detail);
	}

	function handleTrackSolo(event: CustomEvent) {
		console.log('Track solo:', event.detail);
	}

	function handleVolumeChange(event: CustomEvent) {
		console.log('Volume changed:', event.detail);
	}

	function handlePanChange(event: CustomEvent) {
		console.log('Pan changed:', event.detail);
	}
</script>

<div class="timeline-editor bg-lime-lightest rounded-lg overflow-hidden shadow-2xl">
	<!-- Timeline Header -->
	<div class="timeline-header bg-lime-dark text-white p-4 flex items-center justify-between">
		<div class="flex items-center gap-4">
			<h3 class="font-bold text-lg">Timeline Editor</h3>

			<!-- Playback Controls -->
			<div class="flex items-center gap-2">
				<button
					class="w-10 h-10 rounded-full bg-lime-base hover:bg-lime-medium flex items-center justify-center transition-colors neon-glow"
					on:click={togglePlay}
				>
					{#if isPlaying}
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
							<path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z" />
						</svg>
					{:else}
						<svg class="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
							<path d="M6 4l10 6-10 6V4z" />
						</svg>
					{/if}
				</button>

				<button
					class="w-8 h-8 rounded bg-lime-base/50 hover:bg-lime-base/70 flex items-center justify-center transition-colors"
					title="Stop"
				>
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
						<path d="M5 5h10v10H5V5z" />
					</svg>
				</button>
			</div>
		</div>

		<!-- Timeline Controls -->
		<div class="flex items-center gap-4">
			<!-- BPM -->
			<div class="flex items-center gap-2">
				<label class="text-sm">BPM:</label>
				<input
					type="number"
					bind:value={bpm}
					min="60"
					max="200"
					class="w-16 px-2 py-1 bg-lime-base/20 border border-lime-light rounded text-white text-center"
				/>
			</div>

			<!-- Grid Snap -->
			<button
				class="px-3 py-1 rounded {gridSnap
					? 'bg-lime-base'
					: 'bg-lime-base/20'} text-white text-sm transition-colors"
				on:click={() => (gridSnap = !gridSnap)}
			>
				Snap: {gridSnap ? 'ON' : 'OFF'}
			</button>

			<!-- Zoom Controls -->
			<div class="flex items-center gap-2">
				<button
					class="w-8 h-8 rounded bg-lime-base/50 hover:bg-lime-base/70 flex items-center justify-center transition-colors"
					on:click={handleZoomOut}
					title="Zoom Out"
				>
					<span class="text-lg">−</span>
				</button>
				<span class="text-sm w-12 text-center">{Math.round(zoom)}px/s</span>
				<button
					class="w-8 h-8 rounded bg-lime-base/50 hover:bg-lime-base/70 flex items-center justify-center transition-colors"
					on:click={handleZoomIn}
					title="Zoom In"
				>
					<span class="text-lg">+</span>
				</button>
			</div>

			<!-- Metronome -->
			<button
				class="px-3 py-1 rounded bg-lime-base/20 hover:bg-lime-base/40 text-white text-sm transition-colors"
				title="Metronome"
			>
				<svg class="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20">
					<path
						d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L11 4.323V3a1 1 0 011-1z"
					/>
				</svg>
			</button>
		</div>
	</div>

	<!-- Timeline Ruler -->
	<div class="timeline-ruler h-10 bg-lime-medium/20 border-b-2 border-lime-light relative overflow-x-auto">
		<div class="relative h-full" style="width: {duration * zoom}px">
			{#each ticks as second}
				<div
					class="tick absolute top-0 h-full border-l border-lime-dark/30"
					style="left: {second * zoom}px"
				>
					<span class="text-xs text-lime-darkest ml-1 font-mono">{second}s</span>
				</div>
			{/each}

			<!-- Playhead -->
			<div
				class="playhead absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
				style="left: {playheadPosition * zoom}px"
			>
				<div class="playhead-handle w-3 h-3 bg-red-500 rounded-full -ml-1.5 -mt-1"></div>
			</div>
		</div>
	</div>

	<!-- Track List -->
	<div class="track-list overflow-y-auto" style="max-height: 500px;">
		{#if clips.length > 0}
			{#each clips as clip, i}
				<TrackRow
					{clip}
					trackNumber={i + 1}
					on:mute={handleTrackMute}
					on:solo={handleTrackSolo}
					on:volumeChange={handleVolumeChange}
					on:panChange={handlePanChange}
				/>
			{/each}
		{:else}
			<div class="p-12 text-center text-gray-500">
				<p class="text-lg">No clips in this jam yet.</p>
				<p class="text-sm mt-2">Add clips to start building your track!</p>
			</div>
		{/if}
	</div>

	<!-- Add Track Button -->
	<div class="p-4 bg-lime-lighter border-t border-lime-light">
		<button
			class="w-full py-3 bg-lime-base hover:bg-lime-medium text-white font-semibold rounded-lg transition-colors neon-glow"
		>
			+ Add Track
		</button>
	</div>
</div>

<style>
	.neon-glow {
		box-shadow: 0 0 10px rgba(88, 175, 59, 0.3), 0 0 20px rgba(88, 175, 59, 0.2);
	}

	.neon-glow:hover {
		box-shadow: 0 0 15px rgba(88, 175, 59, 0.5), 0 0 30px rgba(88, 175, 59, 0.3);
	}

	.playhead {
		transition: left 0.1s linear;
	}
</style>
