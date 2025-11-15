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
					trackStates[selectedTrackIndex].volume = Math.max(0, trackStates[selectedTrackIndex].volume - 0.05);
					handleVolumeChange(selectedTrackIndex);
				}
				break;
			case 'arrowright':
				event.preventDefault();
				if (selectedTrackIndex >= 0 && selectedTrackIndex < clips.length) {
					trackStates[selectedTrackIndex].volume = Math.min(1, trackStates[selectedTrackIndex].volume + 0.05);
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

<div class="track-mixer bg-lime-lightest rounded-lg shadow-2xl overflow-hidden">
	<!-- Mixer Header -->
	<div class="mixer-header bg-lime-dark text-white p-4">
		<h3 class="font-bold text-lg flex items-center gap-2">
			<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
				<path
					d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2l-1 2H8l-1-2H5V5z"
				/>
			</svg>
			Track Mixer
		</h3>
	</div>

	<!-- Channel Strips -->
	<div class="mixer-channels flex gap-4 p-4 overflow-x-auto bg-lime-lighter">
		{#if clips.length > 0}
			{#each clips as clip, i}
				<div
					class="channel-strip flex-shrink-0 w-24 bg-lime-light rounded-lg p-3 border shadow-lg {selectedTrackIndex === i ? 'border-2 border-lime-base ring-2 ring-lime-base/50' : 'border border-lime-base/30'}"
					on:click={() => selectedTrackIndex = i}
					on:keydown={(e) => e.key === 'Enter' && (selectedTrackIndex = i)}
					role="button"
					tabindex="0"
				>
					<!-- Track Number -->
					<div class="text-center mb-3">
						<div class="w-8 h-8 mx-auto rounded-full bg-lime-base text-white flex items-center justify-center font-bold text-sm">
							{i + 1}
						</div>
					</div>

					<!-- Mute/Solo -->
					<div class="flex gap-1 mb-3">
						<button
							class="flex-1 py-1 rounded text-xs font-bold {trackStates[i].muted
								? 'bg-gray-500 text-white'
								: 'bg-lime-base/20 text-lime-darkest hover:bg-lime-base/40'} transition-colors"
							on:click={() => toggleMute(i)}
						>
							M
						</button>
						<button
							class="flex-1 py-1 rounded text-xs font-bold {trackStates[i].solo
								? 'bg-yellow-500 text-white'
								: 'bg-lime-base/20 text-lime-darkest hover:bg-lime-base/40'} transition-colors"
							on:click={() => toggleSolo(i)}
						>
							S
						</button>
					</div>

					<!-- Volume Fader (Vertical) -->
					<div class="fader-container h-48 flex flex-col items-center mb-3">
						<input
							type="range"
							min="0"
							max="1"
							step="0.01"
							bind:value={trackStates[i].volume}
							on:input={() => handleVolumeChange(i)}
							class="volume-fader accent-lime-base"
							orient="vertical"
						/>
						<div class="w-full h-2 bg-lime-base rounded mt-2" style="width: {trackStates[i].volume * 100}%"></div>
						<span class="text-xs font-mono text-lime-darkest mt-1">
							{Math.round(trackStates[i].volume * 100)}
						</span>
					</div>

					<!-- Pan Knob -->
					<div class="pan-control mb-3">
						<div class="relative w-16 h-16 mx-auto bg-lime-darkest/20 rounded-full border-2 border-lime-base/50">
							<div
								class="pan-indicator absolute inset-0 flex items-center justify-center"
								style="transform: rotate({trackStates[i].pan * 45}deg)"
							>
								<div class="w-1 h-6 bg-lime-base rounded"></div>
							</div>
						</div>
						<input
							type="range"
							min="-1"
							max="1"
							step="0.1"
							bind:value={trackStates[i].pan}
							on:input={() => handlePanChange(i)}
							class="w-full mt-2 accent-lime-base"
						/>
						<span class="text-xs text-center block text-lime-darkest font-mono">
							{trackStates[i].pan === 0 ? 'C' : trackStates[i].pan > 0 ? `R${Math.abs(trackStates[i].pan).toFixed(1)}` : `L${Math.abs(trackStates[i].pan).toFixed(1)}`}
						</span>
					</div>

					<!-- Effects -->
					<div class="effects-rack space-y-1">
						<button
							class="w-full py-1 rounded text-xs font-bold {trackStates[i].effects.eq
								? 'bg-lime-base text-white'
								: 'bg-lime-base/20 text-lime-darkest hover:bg-lime-base/40'} transition-colors"
							on:click={() => toggleEffect(i, 'eq')}
						>
							EQ
						</button>
						<button
							class="w-full py-1 rounded text-xs font-bold {trackStates[i].effects.reverb
								? 'bg-lime-base text-white'
								: 'bg-lime-base/20 text-lime-darkest hover:bg-lime-base/40'} transition-colors"
							on:click={() => toggleEffect(i, 'reverb')}
						>
							REV
						</button>
						<button
							class="w-full py-1 rounded text-xs font-bold {trackStates[i].effects.delay
								? 'bg-lime-base text-white'
								: 'bg-lime-base/20 text-lime-darkest hover:bg-lime-base/40'} transition-colors"
							on:click={() => toggleEffect(i, 'delay')}
						>
							DLY
						</button>
					</div>

					<!-- Track Name -->
					<div class="track-name mt-3 pt-3 border-t border-lime-base/30">
						<p class="text-xs font-semibold text-lime-darkest truncate text-center">
							{clip.title}
						</p>
					</div>
				</div>
			{/each}

			<!-- Master Channel -->
			<div class="channel-strip flex-shrink-0 w-24 bg-lime-base rounded-lg p-3 border-2 border-lime-darkest shadow-xl">
				<div class="text-center mb-3">
					<div class="w-8 h-8 mx-auto rounded-full bg-lime-darkest text-white flex items-center justify-center font-bold text-sm">
						M
					</div>
				</div>

				<div class="fader-container h-48 flex flex-col items-center mb-3">
					<input
						type="range"
						min="0"
						max="1"
						step="0.01"
						value="0.8"
						class="volume-fader accent-lime-darkest"
						orient="vertical"
					/>
					<div class="w-full h-2 bg-lime-darkest rounded mt-2" style="width: 80%"></div>
					<span class="text-xs font-mono text-white mt-1">80</span>
				</div>

				<p class="text-xs font-bold text-white text-center mt-3">MASTER</p>
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
