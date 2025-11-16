<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import TrackRow from './TrackRow.svelte';
	import type { Clip } from '$lib/api';
	import { audioEngine } from '$lib/services/audioEngine';
	import { getCachedWaveform, type WaveformData } from '$lib/utils/waveform';

	interface Props {
		clips?: Clip[];
	}

	let { clips = [] }: Props = $props();

	let bpm = $state(120);
	let gridSnap = $state(true);
	let snapValue = $state(0.25); // Quarter note

	let zoom = $state(50); // pixels per second
	let playheadPosition = $state(0);
	let isPlaying = $state(false);
	let duration = $state(60); // Total timeline duration in seconds
	let selectedTrackIndex = $state(0);
	let isDragOver = $state(false);

	interface ClipPlacement {
		clip: Clip;
		startTime: number;
		trackIndex: number;
		waveform: WaveformData | null;
	}

	let placedClips = $state<ClipPlacement[]>([]);

	// Store waveforms for each clip
	let clipWaveforms = $state<Map<string, WaveformData>>(new Map());

	// Generate time ruler ticks
	let ticks = $derived(Array.from({ length: Math.ceil(duration) }, (_, i) => i));

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

	let isExporting = $state(false);

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

			console.log(`Exported mixdown: ${filename}`);
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

			// Check if clip exists in the timeline already
			const existingPlacementIndex = placedClips.findIndex(
				(p) => p.clip._id === data.clip._id
			);

			if (existingPlacementIndex >= 0) {
				// Update existing placement
				placedClips[existingPlacementIndex].startTime = dropTime;
				placedClips[existingPlacementIndex].trackIndex = selectedTrackIndex;
				placedClips = [...placedClips]; // Trigger reactivity
			} else {
				// Add new clip placement
				placedClips = [
					...placedClips,
					{
						clip: data.clip,
						startTime: dropTime,
						trackIndex: selectedTrackIndex,
						waveform: clipWaveforms.get(data.clip._id) || null
					}
				];
			}

			// Update the audio engine with the new start time
			audioEngine.updateClipStartTime(data.clip._id, dropTime);

			console.log(
				`🎯 Clip "${data.clip.title}" placed at ${dropTime.toFixed(2)}s on track ${selectedTrackIndex}`
			);
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

	let isLoadingClips = $state(false);

	onMount(async () => {
		window.addEventListener('keydown', handleKeyDown);

		// Initialize audio engine
		await audioEngine.init();
		audioEngine.setBPM(bpm);

		// Load all clips into the audio engine and extract waveforms
		if (clips.length > 0) {
			isLoadingClips = true;
			try {
				console.log(`Loading ${clips.length} clips into audio engine...`);

				// Load clips in parallel for faster loading
				await Promise.all(
					clips.map(async (clip) => {
						// Load audio into engine
						await audioEngine.loadClip(clip._id, clip.audio, 0);

						// Extract waveform data
						const waveform = await getCachedWaveform(clip.audio, 20);
						clipWaveforms.set(clip._id, waveform);
					})
				);

				console.log('All clips loaded successfully');
			} catch (error) {
				console.error('Failed to load clips:', error);
				alert('Failed to load some audio clips. Please refresh and try again.');
			} finally {
				isLoadingClips = false;
			}
		}
	});

	// Watch for BPM changes and update audio engine
	$effect(() => {
		if (typeof window !== 'undefined') {
			audioEngine.setBPM(bpm);
		}
	});

	onDestroy(() => {
		window.removeEventListener('keydown', handleKeyDown);
		if (playheadInterval) {
			clearInterval(playheadInterval);
		}
		audioEngine.stop();
	});
</script>

<div class="timeline-editor bg-lime-lightest overflow-hidden rounded-lg shadow-2xl">
	<!-- Loading Indicator -->
	{#if isLoadingClips}
		<div class="bg-lime-base/90 absolute inset-0 z-50 flex items-center justify-center">
			<div class="rounded-lg bg-white p-8 text-center shadow-2xl">
				<svg
					class="text-lime-base mx-auto mb-4 h-12 w-12 animate-spin"
					fill="none"
					viewBox="0 0 24 24"
				>
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
				<p class="text-lime-dark text-lg font-semibold">Loading audio clips...</p>
				<p class="text-lime-dark/70 mt-2 text-sm">This may take a moment</p>
			</div>
		</div>
	{/if}

	<!-- Timeline Header -->
	<div class="timeline-header bg-lime-dark flex items-center justify-between p-4 text-white">
		<div class="flex items-center gap-4">
			<h3 class="text-lg font-bold">Timeline Editor</h3>
			<span class="text-lime-lightest/70 hidden text-sm md:inline"
				>Tip: Drag clips from below onto the timeline</span
			>

			<!-- Playback Controls -->
			<div class="flex items-center gap-2">
				<button
					class="bg-lime-base hover:bg-lime-medium neon-glow flex h-10 w-10 items-center justify-center rounded-full transition-colors"
					onclick={togglePlay}
				>
					{#if isPlaying}
						<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
							<path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z" />
						</svg>
					{:else}
						<svg class="ml-0.5 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
							<path d="M6 4l10 6-10 6V4z" />
						</svg>
					{/if}
				</button>

				<button
					class="bg-lime-base/50 hover:bg-lime-base/70 flex h-8 w-8 items-center justify-center rounded transition-colors"
					onclick={stopPlayback}
					title="Stop"
				>
					<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
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
					class="bg-lime-base/20 border-lime-light w-16 rounded border px-2 py-1 text-center text-white"
				/>
			</div>

			<!-- Grid Snap -->
			<button
				class="rounded px-3 py-1 {gridSnap
					? 'bg-lime-base'
					: 'bg-lime-base/20'} text-sm text-white transition-colors"
				onclick={() => (gridSnap = !gridSnap)}
			>
				Snap: {gridSnap ? 'ON' : 'OFF'}
			</button>

			<!-- Zoom Controls -->
			<div class="flex items-center gap-2">
				<button
					class="bg-lime-base/50 hover:bg-lime-base/70 flex h-8 w-8 items-center justify-center rounded transition-colors"
					onclick={handleZoomOut}
					title="Zoom Out"
				>
					<span class="text-lg">−</span>
				</button>
				<span class="w-12 text-center text-sm">{Math.round(zoom)}px/s</span>
				<button
					class="bg-lime-base/50 hover:bg-lime-base/70 flex h-8 w-8 items-center justify-center rounded transition-colors"
					onclick={handleZoomIn}
					title="Zoom In"
				>
					<span class="text-lg">+</span>
				</button>
			</div>

			<!-- Metronome -->
			<button
				class="bg-lime-base/20 hover:bg-lime-base/40 rounded px-3 py-1 text-sm text-white transition-colors"
				title="Metronome"
			>
				<svg class="inline h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
					<path
						d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L11 4.323V3a1 1 0 011-1z"
					/>
				</svg>
			</button>

			<!-- Export Button -->
			<button
				class="bg-lime-base hover:bg-lime-medium neon-glow flex items-center gap-2 rounded px-4 py-2 text-sm font-semibold text-white transition-colors {isExporting
					? 'cursor-not-allowed opacity-50'
					: ''}"
				onclick={handleExport}
				disabled={isExporting}
				title="Export Mixdown"
			>
				{#if isExporting}
					<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					Exporting...
				{:else}
					<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
						<path
							d="M10 3a1 1 0 00-1 1v5H6a1 1 0 100 2h3v5a1 1 0 102 0v-5h3a1 1 0 100-2h-3V4a1 1 0 00-1-1z"
						/>
						<path d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
					</svg>
					Export
				{/if}
			</button>
		</div>
	</div>

	<!-- Timeline Ruler -->
	<div
		class="timeline-ruler bg-lime-medium/20 border-lime-light relative h-10 overflow-x-auto border-b-2"
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		ondrop={handleDrop}
		role="region"
		aria-label="Timeline ruler"
	>
		<div
			class="relative h-full {isDragOver ? 'bg-lime-base/20' : ''}"
			style="width: {duration * zoom}px"
		>
			{#each ticks as second (second)}
				<div
					class="tick border-lime-dark/30 absolute top-0 h-full border-l"
					style="left: {second * zoom}px"
				>
					<span class="text-lime-darkest ml-1 font-mono text-xs">{second}s</span>
				</div>
			{/each}

			<!-- Playhead -->
			<div
				class="playhead absolute top-0 bottom-0 z-10 w-0.5 bg-red-500"
				style="left: {playheadPosition * zoom}px"
			>
				<div class="playhead-handle -mt-1 -ml-1.5 h-3 w-3 rounded-full bg-red-500"></div>
			</div>
		</div>
	</div>

	<!-- Timeline Canvas with Placed Clips -->
	<div
		class="timeline-canvas bg-lime-lightest border-lime-light relative overflow-x-auto overflow-y-auto border-b-2"
		style="max-height: 400px;"
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		ondrop={handleDrop}
		role="region"
		aria-label="Timeline canvas"
	>
		<div class="relative" style="width: {duration * zoom}px; height: {clips.length * 80}px;">
			<!-- Grid lines -->
			{#each ticks as second (second)}
				<div
					class="border-lime-dark/10 absolute top-0 bottom-0 border-l"
					style="left: {second * zoom}px"
				></div>
			{/each}

			<!-- Track lanes -->
			{#each clips as clip, i (clip._id)}
				<div
					class="border-lime-light/50 absolute right-0 left-0 border-b {selectedTrackIndex === i
						? 'bg-lime-base/5'
						: 'bg-transparent'} hover:bg-lime-base/10 cursor-pointer transition-colors"
					style="top: {i * 80}px; height: 80px;"
					onclick={() => (selectedTrackIndex = i)}
					onkeydown={(e) => e.key === 'Enter' && (selectedTrackIndex = i)}
					role="button"
					tabindex="0"
				>
					<div class="text-lime-darkest/50 absolute top-2 left-2 font-mono text-xs">
						Track {i + 1}: {clip.title}
					</div>
				</div>
			{/each}

			<!-- Placed clips -->
			{#each placedClips as placement, idx (idx)}
				{@const clipDuration = audioEngine.getClipDuration(placement.clip._id)}
				{@const clipWidth = Math.max(clipDuration * zoom, 100)}
				<div
					class="bg-lime-base/80 border-lime-dark hover:bg-lime-base absolute cursor-move overflow-hidden rounded-lg border-2 shadow-lg transition-all"
					style="left: {placement.startTime * zoom}px; top: {placement.trackIndex * 80 +
						10}px; width: {clipWidth}px; height: 60px;"
					draggable="true"
					role="button"
					tabindex="0"
				>
					<div class="flex h-full flex-col p-2">
						<p class="truncate text-xs font-bold text-white">{placement.clip.title}</p>
						<div class="mt-1 flex flex-1 items-end gap-px">
							{#if placement.waveform}
								<!-- Real waveform visualization -->
								{#each placement.waveform.peaks as peak, waveIdx (waveIdx)}
									<div
										class="flex-1 bg-white/70"
										style="height: {Math.max(peak * 100, 5)}%"
									></div>
								{/each}
							{:else}
								<!-- Fallback placeholder -->
								{#each Array(15).fill(0) as _, waveIdx (waveIdx)}
									<div class="w-1 bg-white/50" style="height: {Math.random() * 100}%"></div>
								{/each}
							{/if}
						</div>
						<p class="font-mono text-xs text-white/70">
							{placement.startTime.toFixed(2)}s - {(placement.startTime + clipDuration).toFixed(2)}s
						</p>
					</div>
				</div>
			{/each}

			<!-- Playhead on canvas -->
			<div
				class="pointer-events-none absolute top-0 bottom-0 z-20 w-0.5 bg-red-500"
				style="left: {playheadPosition * zoom}px"
			>
				<div class="-ml-1.5 h-3 w-3 rounded-full bg-red-500"></div>
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
				<p class="mt-2 text-sm">Add clips to start building your track!</p>
			</div>
		{/if}
	</div>

	<!-- Add Track Button -->
	<div class="bg-lime-lighter border-lime-light border-t p-4">
		<button
			class="bg-lime-base hover:bg-lime-medium neon-glow w-full rounded-lg py-3 font-semibold text-white transition-colors"
		>
			+ Add Track
		</button>
	</div>
</div>

<style>
	.neon-glow {
		box-shadow:
			0 0 10px rgba(88, 175, 59, 0.3),
			0 0 20px rgba(88, 175, 59, 0.2);
	}

	.neon-glow:hover {
		box-shadow:
			0 0 15px rgba(88, 175, 59, 0.5),
			0 0 30px rgba(88, 175, 59, 0.3);
	}

	.playhead {
		transition: left 0.1s linear;
	}
</style>
