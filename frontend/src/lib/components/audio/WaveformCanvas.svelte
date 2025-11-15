<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import WaveSurfer from 'wavesurfer.js';

	export let audioUrl: string;
	export let height = 80;
	export let playing = false;
	export let onReady: ((duration: number) => void) | null = null;
	export let onTimeUpdate: ((currentTime: number) => void) | null = null;

	let container: HTMLDivElement;
	let wavesurfer: WaveSurfer | null = null;

	onMount(() => {
		if (!container) return;

		wavesurfer = WaveSurfer.create({
			container,
			waveColor: '#9bcf89',
			progressColor: '#58af3b',
			cursorColor: '#ff4444',
			height,
			barWidth: 2,
			barGap: 1,
			barRadius: 2,
			normalize: true,
			backend: 'WebAudio'
		});

		wavesurfer.load(audioUrl);

		wavesurfer.on('ready', () => {
			if (onReady) onReady(wavesurfer!.getDuration());
		});

		wavesurfer.on('audioprocess', () => {
			if (onTimeUpdate) onTimeUpdate(wavesurfer!.getCurrentTime());
		});

		wavesurfer.on('interaction', () => {
			if (onTimeUpdate) onTimeUpdate(wavesurfer!.getCurrentTime());
		});
	});

	$: if (wavesurfer) {
		if (playing) {
			wavesurfer.play();
		} else {
			wavesurfer.pause();
		}
	}

	export function seek(time: number) {
		if (wavesurfer) {
			wavesurfer.seekTo(time / wavesurfer.getDuration());
		}
	}

	export function getDuration(): number {
		return wavesurfer?.getDuration() || 0;
	}

	export function getCurrentTime(): number {
		return wavesurfer?.getCurrentTime() || 0;
	}

	onDestroy(() => {
		if (wavesurfer) {
			wavesurfer.destroy();
		}
	});
</script>

<div bind:this={container} class="waveform-canvas w-full rounded-lg overflow-hidden"></div>
