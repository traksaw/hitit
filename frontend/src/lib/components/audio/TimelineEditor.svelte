<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import TrackRow from './TrackRow.svelte';
	import type { Clip } from '$lib/api';
	import { audioEngine } from '$lib/services/audioEngine';

	export let clips: Clip[] = [];
	export let bpm = 120;
	export let gridSnap = true;
	export let snapValue = 0.25; // Quarter note

	let zoom = 50; // pixels per second
	let playheadPosition = 0;
	let isPlaying = false;
	let duration = 60; // Total timeline duration in seconds
	let selectedTrackIndex = 0;
	let isDragOver = false;

	interface ClipPlacement {
		clip: Clip;
		startTime: number;
		trackIndex: number;
	}

	let placedClips: ClipPlacement[] = [];

	// Generate time ruler ticks
	$: ticks = Array.from({ length: Math.ceil(duration) }, (_, i) => i);

	let playheadInterval: number | null = null;

	async function togglePlay() {
		if (!isPlaying) {
			// Start playback
			try {
				await audioEngine.init();
				audioEngine.play();
				isPlaying = true;

				// Update playhead position
				playheadInterval = window.setInterval(() => {
					playheadPosition = audioEngine.getPlaybackPosition();
				}, 50) as unknown as number;
			} catch (error) {
				console.error('Failed to start playback:', error);
			}
		} else {
			// Pause playback
			audioEngine.pause();
			isPlaying = false;

			if (playheadInterval) {
				clearInterval(playheadInterval);
				playheadInterval = null;
			}
		}
	}

	function stopPlayback() {
		audioEngine.stop();
		isPlaying = false;
		playheadPosition = 0;

		if (playheadInterval) {
			clearInterval(playheadInterval);
			playheadInterval = null;
		}
	}

	let isExporting = false;

	async function handleExport() {
		try {
			isExporting = true;

			// Export the mixdown
			const blob = await audioEngine.exportMixdown(duration);

			// Generate filename with timestamp
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
			const filename = `hit-it-mixdown-${timestamp}.wav`;

			// Download the file
			audioEngine.downloadMixdown(blob, filename);

			console.log(`✅ Exported mixdown: ${filename}`);
		} catch (error) {
			console.error('Failed to export mixdown:', error);
			alert('Failed to export mixdown. Please try again.');
		} finally {
			isExporting = false;
		}
	}

	function handleZoomIn() {
		zoom = Math.min(zoom * 1.5, 200);
	}

	function handleZoomOut() {
		zoom = Math.max(zoom / 1.5, 20);
	}

	function handleTrackMute(event: CustomEvent) {
		const { trackNumber, isMuted } = event.detail;
		const clipIndex = trackNumber - 1;
		if (clips[clipIndex]) {
			audioEngine.setMute(clips[clipIndex]._id, isMuted);
		}
	}

	function handleTrackSolo(event: CustomEvent) {
		const { trackNumber, isSolo } = event.detail;
		const clipIndex = trackNumber - 1;
		if (clips[clipIndex]) {
			audioEngine.setSolo(clips[clipIndex]._id, isSolo);
		}
	}

	function handleVolumeChange(event: CustomEvent) {
		const { trackNumber, volume } = event.detail;
		const clipIndex = trackNumber - 1;
		if (clips[clipIndex]) {
			audioEngine.setVolume(clips[clipIndex]._id, volume);
		}
	}

	function handlePanChange(event: CustomEvent) {
		const { trackNumber, pan } = event.detail;
		const clipIndex = trackNumber - 1;
		if (clips[clipIndex]) {
			audioEngine.setPan(clips[clipIndex]._id, pan);
		}
	}

	// Drag and drop handlers for timeline
	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragOver = true;
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
	}

	function handleDragLeave() {
		isDragOver = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;

		if (!event.dataTransfer) return;

		try {
			const data = JSON.parse(event.dataTransfer.getData('application/json'));
			const timelineRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
			const clickX = event.clientX - timelineRect.left;

			// Calculate drop position in seconds
			let dropTime = clickX / zoom;

			// Apply grid snap if enabled
			if (gridSnap) {
				const beatsPerSecond = bpm / 60;
				const snapInterval = snapValue / beatsPerSecond;
				dropTime = Math.round(dropTime / snapInterval) * snapInterval;
			}

			// Add clip to placed clips
			placedClips = [...placedClips, {
				clip: data.clip,
				startTime: dropTime,
				trackIndex: selectedTrackIndex
			}];

			console.log('Clip placed at', dropTime, 'seconds on track', selectedTrackIndex);
		} catch (error) {
			console.error('Error handling drop:', error);
		}
	}

	// Keyboard shortcuts handler
	function handleKeyDown(event: KeyboardEvent) {
		// Ignore if typing in an input field
		if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
			return;
		}

		switch (event.key.toLowerCase()) {
			case ' ':
				event.preventDefault();
				togglePlay();
				break;
			case '+':
			case '=':
				event.preventDefault();
				handleZoomIn();
				break;
			case '-':
			case '_':
				event.preventDefault();
				handleZoomOut();
				break;
			case 'm':
				event.preventDefault();
				if (selectedTrackIndex >= 0 && selectedTrackIndex < clips.length) {
					handleTrackMute({ detail: { index: selectedTrackIndex } } as CustomEvent);
				}
				break;
			case 's':
				event.preventDefault();
				if (selectedTrackIndex >= 0 && selectedTrackIndex < clips.length) {
					handleTrackSolo({ detail: { index: selectedTrackIndex } } as CustomEvent);
				}
				break;
			case 'arrowup':
				event.preventDefault();
				selectedTrackIndex = Math.max(0, selectedTrackIndex - 1);
				break;
			case 'arrowdown':
				event.preventDefault();
				selectedTrackIndex = Math.min(clips.length - 1, selectedTrackIndex + 1);
				break;
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeyDown);
		audioEngine.init();
		audioEngine.setBPM(bpm);
	});

	// Watch for BPM changes and update audio engine
	let lastBpm = bpm;
	$: if (bpm !== lastBpm && typeof window !== 'undefined') {
		lastBpm = bpm;
		audioEngine.setBPM(bpm);
	}

	onDestroy(() => {
		window.removeEventListener('keydown', handleKeyDown);
		if (playheadInterval) {
			clearInterval(playheadInterval);
		}
		audioEngine.stop();
	});
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
					on:click={stopPlayback}
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
				<label for="bpm-input" class="text-sm">BPM:</label>
				<input
					id="bpm-input"
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

			<!-- Export Button -->
			<button
				class="px-4 py-2 rounded bg-lime-base hover:bg-lime-medium text-white text-sm font-semibold transition-colors neon-glow flex items-center gap-2 {isExporting ? 'opacity-50 cursor-not-allowed' : ''}"
				on:click={handleExport}
				disabled={isExporting}
				title="Export Mixdown"
			>
				{#if isExporting}
					<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					Exporting...
				{:else}
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
						<path d="M10 3a1 1 0 00-1 1v5H6a1 1 0 100 2h3v5a1 1 0 102 0v-5h3a1 1 0 100-2h-3V4a1 1 0 00-1-1z" />
						<path d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
					</svg>
					Export
				{/if}
			</button>
		</div>
	</div>

	<!-- Timeline Ruler -->
	<div
		class="timeline-ruler h-10 bg-lime-medium/20 border-b-2 border-lime-light relative overflow-x-auto"
		on:dragover={handleDragOver}
		on:dragleave={handleDragLeave}
		on:drop={handleDrop}
		role="region"
		aria-label="Timeline ruler"
	>
		<div class="relative h-full {isDragOver ? 'bg-lime-base/20' : ''}" style="width: {duration * zoom}px">
			{#each ticks as second (second)}
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

	<!-- Timeline Canvas with Placed Clips -->
	<div
		class="timeline-canvas relative overflow-x-auto overflow-y-auto bg-lime-lightest border-b-2 border-lime-light"
		style="max-height: 400px;"
		on:dragover={handleDragOver}
		on:dragleave={handleDragLeave}
		on:drop={handleDrop}
		role="region"
		aria-label="Timeline canvas"
	>
		<div class="relative" style="width: {duration * zoom}px; height: {clips.length * 80}px;">
			<!-- Grid lines -->
			{#each ticks as second (second)}
				<div
					class="absolute top-0 bottom-0 border-l border-lime-dark/10"
					style="left: {second * zoom}px"
				></div>
			{/each}

			<!-- Track lanes -->
			{#each clips as clip, i (clip._id)}
				<div
					class="absolute left-0 right-0 border-b border-lime-light/50 {selectedTrackIndex === i ? 'bg-lime-base/5' : 'bg-transparent'} hover:bg-lime-base/10 transition-colors cursor-pointer"
					style="top: {i * 80}px; height: 80px;"
					on:click={() => selectedTrackIndex = i}
					on:keydown={(e) => e.key === 'Enter' && (selectedTrackIndex = i)}
					role="button"
					tabindex="0"
				>
					<div class="absolute left-2 top-2 text-xs text-lime-darkest/50 font-mono">
						Track {i + 1}: {clip.title}
					</div>
				</div>
			{/each}

			<!-- Placed clips -->
			{#each placedClips as placement, idx (idx)}
				<div
					class="absolute bg-lime-base/80 border-2 border-lime-dark rounded-lg shadow-lg overflow-hidden cursor-move hover:bg-lime-base transition-all"
					style="left: {placement.startTime * zoom}px; top: {placement.trackIndex * 80 + 10}px; width: 150px; height: 60px;"
					draggable="true"
					role="button"
					tabindex="0"
				>
					<div class="p-2 h-full flex flex-col">
						<p class="text-xs font-bold text-white truncate">{placement.clip.title}</p>
						<div class="flex-1 flex items-center gap-px mt-1">
							<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
							{#each Array(15).fill(0) as _, waveIdx (waveIdx)}
								<div class="w-1 bg-white/50" style="height: {Math.random() * 100}%"></div>
							{/each}
						</div>
						<p class="text-xs text-white/70 font-mono">{placement.startTime.toFixed(2)}s</p>
					</div>
				</div>
			{/each}

			<!-- Playhead on canvas -->
			<div
				class="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
				style="left: {playheadPosition * zoom}px"
			>
				<div class="w-3 h-3 bg-red-500 rounded-full -ml-1.5"></div>
			</div>
		</div>
	</div>

	<!-- Track List -->
	<div class="track-list overflow-y-auto" style="max-height: 200px;">
		{#if clips.length > 0}
			{#each clips as clip, i (clip._id)}
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
