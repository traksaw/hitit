<script lang="ts">
	import { onMount } from 'svelte';
	import WaveformCanvas from './WaveformCanvas.svelte';
	import type { Jam } from '$lib/api';

	export let currentJam: Jam | null = null;
	export let currentClipUrl: string | null = null;

	let playing = false;
	let currentTime = 0;
	let duration = 0;
	let volume = 0.8;
	let waveformRef: WaveformCanvas;

	function togglePlay() {
		playing = !playing;
	}

	function handleTimeUpdate(time: number) {
		currentTime = time;
	}

	function handleReady(dur: number) {
		duration = dur;
	}

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function handleSeek(e: MouseEvent) {
		const target = e.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const percentage = x / rect.width;
		const newTime = percentage * duration;
		waveformRef?.seek(newTime);
	}
</script>

{#if currentJam && currentClipUrl}
	<div
		class="fixed bottom-0 left-0 right-0 bg-lime-dark border-t-2 border-lime-light h-28 flex items-center justify-between px-6 z-50 shadow-2xl"
		style="box-shadow: 0 -4px 20px rgba(88, 175, 59, 0.3);"
	>
		<!-- Left: Current Jam Info -->
		<div class="flex items-center gap-4 w-1/4">
			<img src={currentJam.image} alt={currentJam.title} class="w-16 h-16 rounded-lg object-cover shadow-lg" />
			<div class="overflow-hidden">
				<p class="text-white font-semibold truncate">{currentJam.title}</p>
				<p class="text-lime-light text-sm">{currentJam.genre}</p>
			</div>
		</div>

		<!-- Center: Playback Controls & Waveform -->
		<div class="flex-1 max-w-3xl mx-8">
			<!-- Play/Pause Controls -->
			<div class="flex items-center justify-center gap-4 mb-2">
				<button
					class="w-10 h-10 rounded-full bg-lime-base hover:bg-lime-medium text-white flex items-center justify-center transition-all duration-200 hover:scale-110 neon-glow"
					on:click={togglePlay}
				>
					{#if playing}
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
							<path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z" />
						</svg>
					{:else}
						<svg class="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
							<path d="M6 4l10 6-10 6V4z" />
						</svg>
					{/if}
				</button>
			</div>

			<!-- Waveform -->
			<div
				class="waveform-container relative h-16 bg-lime-darkest/50 rounded-lg cursor-pointer"
				on:click={handleSeek}
				role="button"
				tabindex="0"
			>
				<WaveformCanvas
					bind:this={waveformRef}
					audioUrl={currentClipUrl}
					{playing}
					onReady={handleReady}
					onTimeUpdate={handleTimeUpdate}
					height={64}
				/>
			</div>

			<!-- Time Display -->
			<div class="flex justify-between text-xs text-lime-lightest mt-1 px-1">
				<span>{formatTime(currentTime)}</span>
				<span>{formatTime(duration)}</span>
			</div>
		</div>

		<!-- Right: Volume & Controls -->
		<div class="flex items-center gap-4 w-1/4 justify-end">
			<!-- Volume Control -->
			<div class="flex items-center gap-2">
				<svg class="w-5 h-5 text-lime-lightest" fill="currentColor" viewBox="0 0 20 20">
					<path
						d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z"
					/>
				</svg>
				<input
					type="range"
					min="0"
					max="1"
					step="0.01"
					bind:value={volume}
					class="w-24 accent-lime-base"
				/>
			</div>

			<!-- Queue/More -->
			<button
				class="w-8 h-8 rounded-full bg-lime-base/20 hover:bg-lime-base/40 text-lime-lightest flex items-center justify-center transition-colors"
				title="Queue"
			>
				<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
					<path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
					<path
						fill-rule="evenodd"
						d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
						clip-rule="evenodd"
					/>
				</svg>
			</button>
		</div>
	</div>
{/if}

<style>
	.neon-glow {
		box-shadow: 0 0 10px rgba(88, 175, 59, 0.3), 0 0 20px rgba(88, 175, 59, 0.2);
	}

	.neon-glow:hover {
		box-shadow: 0 0 15px rgba(88, 175, 59, 0.5), 0 0 30px rgba(88, 175, 59, 0.3);
	}
</style>
