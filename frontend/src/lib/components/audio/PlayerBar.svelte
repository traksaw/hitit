<script lang="ts">
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
		class="bg-lime-dark border-lime-light fixed right-0 bottom-0 left-0 z-50 border-t-2 shadow-2xl"
		style="box-shadow: 0 -4px 20px rgba(88, 175, 59, 0.3);"
	>
		<!-- Desktop Layout: Horizontal -->
		<div class="hidden h-28 items-center justify-between px-4 md:flex md:px-6">
			<!-- Left: Current Jam Info -->
			<div class="flex w-1/4 min-w-0 items-center gap-3">
				<img
					src={currentJam.image}
					alt={currentJam.title}
					class="h-14 w-14 shrink-0 rounded-lg object-cover shadow-lg md:h-16 md:w-16"
				/>
				<div class="min-w-0 overflow-hidden">
					<p class="truncate font-semibold text-white">{currentJam.title}</p>
					<p class="text-lime-light truncate text-sm">{currentJam.genre}</p>
				</div>
			</div>

			<!-- Center: Playback Controls & Waveform -->
			<div class="mx-4 max-w-3xl flex-1 md:mx-8">
				<!-- Play/Pause Controls -->
				<div class="mb-2 flex items-center justify-center gap-4">
					<button
						class="bg-lime-base hover:bg-lime-medium neon-glow flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-all duration-200 hover:scale-110"
						onclick={togglePlay}
						aria-label={playing ? 'Pause' : 'Play'}
					>
						{#if playing}
							<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
								<path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z" />
							</svg>
						{:else}
							<svg class="ml-0.5 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
								<path d="M6 4l10 6-10 6V4z" />
							</svg>
						{/if}
					</button>
				</div>

				<!-- Waveform -->
				<div
					class="waveform-container bg-lime-darkest/50 relative h-16 cursor-pointer rounded-lg"
					onclick={handleSeek}
					onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && togglePlay()}
					role="button"
					tabindex="0"
					aria-label="Waveform - click to seek"
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
				<div class="text-lime-lightest mt-1 flex justify-between px-1 text-xs">
					<span>{formatTime(currentTime)}</span>
					<span>{formatTime(duration)}</span>
				</div>
			</div>

			<!-- Right: Volume & Controls -->
			<div class="flex w-1/4 items-center justify-end gap-4">
				<!-- Volume Control -->
				<div class="flex items-center gap-2">
					<svg class="text-lime-lightest h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
						class="accent-lime-base w-20 md:w-24"
						aria-label="Volume"
					/>
				</div>

				<!-- Queue/More -->
				<button
					class="bg-lime-base/20 hover:bg-lime-base/40 text-lime-lightest flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors"
					title="Queue"
					aria-label="Open queue"
				>
					<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
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

		<!-- Mobile Layout: Compact Vertical -->
		<div class="flex flex-col gap-2 p-3 md:hidden">
			<!-- Top Row: Jam Info + Play Button -->
			<div class="flex items-center gap-3">
				<img
					src={currentJam.image}
					alt={currentJam.title}
					class="h-12 w-12 shrink-0 rounded-lg object-cover shadow-lg"
				/>
				<div class="min-w-0 flex-1 overflow-hidden">
					<p class="truncate text-sm font-semibold text-white">{currentJam.title}</p>
					<p class="text-lime-light truncate text-xs">{currentJam.genre}</p>
				</div>
				<button
					class="bg-lime-base hover:bg-lime-medium neon-glow flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white transition-all active:scale-95"
					onclick={togglePlay}
					aria-label={playing ? 'Pause' : 'Play'}
				>
					{#if playing}
						<svg class="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
							<path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z" />
						</svg>
					{:else}
						<svg class="ml-0.5 h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
							<path d="M6 4l10 6-10 6V4z" />
						</svg>
					{/if}
				</button>
			</div>

			<!-- Waveform -->
			<div
				class="waveform-container bg-lime-darkest/50 relative h-14 cursor-pointer rounded-lg"
				onclick={handleSeek}
				onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && togglePlay()}
				role="button"
				tabindex="0"
				aria-label="Waveform - tap to seek"
			>
				<WaveformCanvas
					bind:this={waveformRef}
					audioUrl={currentClipUrl}
					{playing}
					onReady={handleReady}
					onTimeUpdate={handleTimeUpdate}
					height={56}
				/>
			</div>

			<!-- Bottom Row: Time + Volume -->
			<div class="flex items-center justify-between gap-3">
				<div class="text-lime-lightest flex gap-2 text-xs">
					<span>{formatTime(currentTime)}</span>
					<span>/</span>
					<span>{formatTime(duration)}</span>
				</div>
				<div class="flex flex-1 items-center justify-end gap-2">
					<svg class="text-lime-lightest h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
						class="accent-lime-base h-1 max-w-[120px] flex-1"
						aria-label="Volume"
					/>
				</div>
			</div>
		</div>
	</div>
{/if}

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
</style>
