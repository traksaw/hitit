import { writable } from 'svelte/store';
import type { Jam, Clip } from '$lib/api';

export interface AudioPlayerState {
	currentJam: Jam | null;
	currentClip: Clip | null;
	currentClipUrl: string | null;
	isPlaying: boolean;
	currentTime: number;
	duration: number;
	volume: number;
}

function createAudioStore() {
	const { subscribe, set, update } = writable<AudioPlayerState>({
		currentJam: null,
		currentClip: null,
		currentClipUrl: null,
		isPlaying: false,
		currentTime: 0,
		duration: 0,
		volume: 0.8
	});

	return {
		subscribe,
		setCurrentJam: (jam: Jam, clip?: Clip) => {
			update((state) => ({
				...state,
				currentJam: jam,
				currentClip: clip || null,
				currentClipUrl: clip?.audio || null
			}));
		},
		play: () => update((state) => ({ ...state, isPlaying: true })),
		pause: () => update((state) => ({ ...state, isPlaying: false })),
		togglePlay: () => update((state) => ({ ...state, isPlaying: !state.isPlaying })),
		setCurrentTime: (time: number) => update((state) => ({ ...state, currentTime: time })),
		setDuration: (duration: number) => update((state) => ({ ...state, duration })),
		setVolume: (volume: number) => update((state) => ({ ...state, volume })),
		reset: () =>
			set({
				currentJam: null,
				currentClip: null,
				currentClipUrl: null,
				isPlaying: false,
				currentTime: 0,
				duration: 0,
				volume: 0.8
			})
	};
}

export const audioStore = createAudioStore();
