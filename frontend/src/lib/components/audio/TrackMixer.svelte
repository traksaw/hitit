<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import type { Clip } from '$lib/api';
	import { audioEngine } from '$lib/services/audioEngine';

	export let clips: Clip[] = [];

	const dispatch = createEventDispatcher();

	interface TrackState {
		volume: number;
		pan: number;
		muted: boolean;
		solo: boolean;
		effects: {
			eq: boolean;
			reverb: boolean;
			delay: boolean;
		};
	}

	let trackStates: TrackState[] = clips.map(() => ({
		volume: 0.8,
		pan: 0,
		muted: false,
		solo: false,
		effects: { eq: false, reverb: false, delay: false }
	}));

	let selectedTrackIndex = 0;

	function handleVolumeChange(index: number) {
		if (clips[index]) {
			audioEngine.setVolume(clips[index]._id, trackStates[index].volume);
		}
		dispatch('volumeChange', { index, volume: trackStates[index].volume });
	}

	function handlePanChange(index: number) {
		if (clips[index]) {
			audioEngine.setPan(clips[index]._id, trackStates[index].pan);
		}
		dispatch('panChange', { index, pan: trackStates[index].pan });
	}

	function toggleMute(index: number) {
		trackStates[index].muted = !trackStates[index].muted;
		if (clips[index]) {
			audioEngine.setMute(clips[index]._id, trackStates[index].muted);
		}
		dispatch('mute', { index, muted: trackStates[index].muted });
	}

	function toggleSolo(index: number) {
		trackStates[index].solo = !trackStates[index].solo;
		if (clips[index]) {
			audioEngine.setSolo(clips[index]._id, trackStates[index].solo);
		}
		dispatch('solo', { index, solo: trackStates[index].solo });
	}

	function toggleEffect(index: number, effect: 'eq' | 'reverb' | 'delay') {
		trackStates[index].effects[effect] = !trackStates[index].effects[effect];
		if (clips[index]) {
			audioEngine.toggleEffect(clips[index]._id, effect, trackStates[index].effects[effect]);
		}
		dispatch('effectToggle', { index, effect, enabled: trackStates[index].effects[effect] });
	}

	// Keyboard shortcuts handler
	function handleKeyDown(event: KeyboardEvent) {
		// Ignore if typing in an input field
		if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
			return;
		}

		switch (event.key.toLowerCase()) {
			case 'm':
				event.preventDefault();
				if (selectedTrackIndex >= 0 && selectedTrackIndex < clips.length) {
					toggleMute(selectedTrackIndex);
				}
				break;
			case 's':
				event.preventDefault();
				if (selectedTrackIndex >= 0 && selectedTrackIndex < clips.length) {
					toggleSolo(selectedTrackIndex);
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
			case 'arrowleft':
				event.preventDefault();
				if (selectedTrackIndex >= 0 && selectedTrackIndex < clips.length) {
					trackStates[selectedTrackIndex].volume = Math.max(
						0,
						trackStates[selectedTrackIndex].volume - 0.05
					);
					handleVolumeChange(selectedTrackIndex);
				}
				break;
			case 'arrowright':
				event.preventDefault();
				if (selectedTrackIndex >= 0 && selectedTrackIndex < clips.length) {
					trackStates[selectedTrackIndex].volume = Math.min(
						1,
						trackStates[selectedTrackIndex].volume + 0.05
					);
					handleVolumeChange(selectedTrackIndex);
				}
				break;
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeyDown);
	});

	onDestroy(() => {
		window.removeEventListener('keydown', handleKeyDown);
	});
</script>

<div class="track-mixer bg-lime-lightest overflow-hidden rounded-lg shadow-2xl">
	<!-- Mixer Header -->
	<div class="mixer-header bg-lime-dark p-4 text-white">
		<h3 class="flex items-center gap-2 text-lg font-bold">
			<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
				<path
					d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2l-1 2H8l-1-2H5V5z"
				/>
			</svg>
			Track Mixer
		</h3>
	</div>

	<!-- Channel Strips -->
	<div class="mixer-channels bg-lime-lighter flex gap-4 overflow-x-auto p-4">
		{#if clips.length > 0}
			{#each clips as clip, i (clip._id)}
				<div
					class="channel-strip bg-lime-light w-24 flex-shrink-0 rounded-lg border p-3 shadow-lg {selectedTrackIndex ===
					i
						? 'border-lime-base ring-lime-base/50 border-2 ring-2'
						: 'border-lime-base/30 border'}"
					on:click={() => (selectedTrackIndex = i)}
					on:keydown={(e) => e.key === 'Enter' && (selectedTrackIndex = i)}
					role="button"
					tabindex="0"
				>
					<!-- Track Number -->
					<div class="mb-3 text-center">
						<div
							class="bg-lime-base mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
						>
							{i + 1}
						</div>
					</div>

					<!-- Mute/Solo -->
					<div class="mb-3 flex gap-1">
						<button
							class="flex-1 rounded py-1 text-xs font-bold {trackStates[i].muted
								? 'bg-gray-500 text-white'
								: 'bg-lime-base/20 text-lime-darkest hover:bg-lime-base/40'} transition-colors"
							on:click={() => toggleMute(i)}
						>
							M
						</button>
						<button
							class="flex-1 rounded py-1 text-xs font-bold {trackStates[i].solo
								? 'bg-yellow-500 text-white'
								: 'bg-lime-base/20 text-lime-darkest hover:bg-lime-base/40'} transition-colors"
							on:click={() => toggleSolo(i)}
						>
							S
						</button>
					</div>

					<!-- Volume Fader (Vertical) -->
					<div class="fader-container mb-3 flex h-48 flex-col items-center">
						<input
							type="range"
							min="0"
							max="1"
							step="0.01"
							bind:value={trackStates[i].volume}
							on:input={() => handleVolumeChange(i)}
							class="volume-fader accent-lime-base"
						/>
						<div
							class="bg-lime-base mt-2 h-2 w-full rounded"
							style="width: {trackStates[i].volume * 100}%"
						></div>
						<span class="text-lime-darkest mt-1 font-mono text-xs">
							{Math.round(trackStates[i].volume * 100)}
						</span>
					</div>

					<!-- Pan Knob -->
					<div class="pan-control mb-3">
						<div
							class="bg-lime-darkest/20 border-lime-base/50 relative mx-auto h-16 w-16 rounded-full border-2"
						>
							<div
								class="pan-indicator absolute inset-0 flex items-center justify-center"
								style="transform: rotate({trackStates[i].pan * 45}deg)"
							>
								<div class="bg-lime-base h-6 w-1 rounded"></div>
							</div>
						</div>
						<input
							type="range"
							min="-1"
							max="1"
							step="0.1"
							bind:value={trackStates[i].pan}
							on:input={() => handlePanChange(i)}
							class="accent-lime-base mt-2 w-full"
						/>
						<span class="text-lime-darkest block text-center font-mono text-xs">
							{trackStates[i].pan === 0
								? 'C'
								: trackStates[i].pan > 0
									? `R${Math.abs(trackStates[i].pan).toFixed(1)}`
									: `L${Math.abs(trackStates[i].pan).toFixed(1)}`}
						</span>
					</div>

					<!-- Effects -->
					<div class="effects-rack space-y-1">
						<button
							class="w-full rounded py-1 text-xs font-bold {trackStates[i].effects.eq
								? 'bg-lime-base text-white'
								: 'bg-lime-base/20 text-lime-darkest hover:bg-lime-base/40'} transition-colors"
							on:click={() => toggleEffect(i, 'eq')}
						>
							EQ
						</button>
						<button
							class="w-full rounded py-1 text-xs font-bold {trackStates[i].effects.reverb
								? 'bg-lime-base text-white'
								: 'bg-lime-base/20 text-lime-darkest hover:bg-lime-base/40'} transition-colors"
							on:click={() => toggleEffect(i, 'reverb')}
						>
							REV
						</button>
						<button
							class="w-full rounded py-1 text-xs font-bold {trackStates[i].effects.delay
								? 'bg-lime-base text-white'
								: 'bg-lime-base/20 text-lime-darkest hover:bg-lime-base/40'} transition-colors"
							on:click={() => toggleEffect(i, 'delay')}
						>
							DLY
						</button>
					</div>

					<!-- Track Name -->
					<div class="track-name border-lime-base/30 mt-3 border-t pt-3">
						<p class="text-lime-darkest truncate text-center text-xs font-semibold">
							{clip.title}
						</p>
					</div>
				</div>
			{/each}

			<!-- Master Channel -->
			<div
				class="channel-strip bg-lime-base border-lime-darkest w-24 flex-shrink-0 rounded-lg border-2 p-3 shadow-xl"
			>
				<div class="mb-3 text-center">
					<div
						class="bg-lime-darkest mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
					>
						M
					</div>
				</div>

				<div class="fader-container mb-3 flex h-48 flex-col items-center">
					<input
						type="range"
						min="0"
						max="1"
						step="0.01"
						value="0.8"
						class="volume-fader accent-lime-darkest"
					/>
					<div class="bg-lime-darkest mt-2 h-2 w-full rounded" style="width: 80%"></div>
					<span class="mt-1 font-mono text-xs text-white">80</span>
				</div>

				<p class="mt-3 text-center text-xs font-bold text-white">MASTER</p>
			</div>
		{:else}
			<div class="w-full p-8 text-center text-gray-500">
				<p>No tracks to mix</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.volume-fader {
		writing-mode: bt-lr; /* For vertical orientation */
		-webkit-appearance: slider-vertical;
		appearance: slider-vertical;
		width: 8px;
		height: 160px;
	}

	.channel-strip {
		background: linear-gradient(to bottom, rgba(222, 239, 216, 0.5), rgba(188, 223, 177, 0.8));
	}

	.channel-strip:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(88, 175, 59, 0.3);
		transition: all 0.2s;
	}
</style>
