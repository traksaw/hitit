import * as Tone from 'tone';

interface TrackChannel {
	player: Tone.Player | null;
	volume: Tone.Volume;
	panner: Tone.Panner;
	effects: {
		eq: Tone.EQ3 | null;
		reverb: Tone.Reverb | null;
		delay: Tone.FeedbackDelay | null;
	};
	muted: boolean;
	solo: boolean;
}

class AudioEngine {
	private transport: typeof Tone.Transport;
	private tracks: Map<string, TrackChannel>;
	private masterChannel: Tone.Channel;
	private isInitialized: boolean;

	constructor() {
		this.transport = Tone.getTransport();
		this.tracks = new Map();
		this.masterChannel = new Tone.Channel().toDestination();
		this.isInitialized = false;
	}

	async init(): Promise<void> {
		if (this.isInitialized) return;

		try {
			await Tone.start();
			console.log('🎵 Tone.js Audio Engine initialized');
			this.isInitialized = true;
		} catch (error) {
			console.error('Failed to initialize audio engine:', error);
			throw error;
		}
	}

	setBPM(bpm: number): void {
		this.transport.bpm.value = bpm;
	}

	async loadClip(clipId: string, audioUrl: string): Promise<void> {
		await this.init();

		// Create track channel if it doesn't exist
		if (!this.tracks.has(clipId)) {
			const volume = new Tone.Volume(0).connect(this.masterChannel);
			const panner = new Tone.Panner(0).connect(volume);

			this.tracks.set(clipId, {
				player: null,
				volume,
				panner,
				effects: {
					eq: null,
					reverb: null,
					delay: null
				},
				muted: false,
				solo: false
			});
		}

		const track = this.tracks.get(clipId)!;

		try {
			// Dispose of existing player if any
			if (track.player) {
				track.player.dispose();
			}

			// Create new player
			const player = new Tone.Player(audioUrl).connect(track.panner);
			track.player = player;

			await Tone.loaded();
			console.log(`✅ Loaded clip: ${clipId}`);
		} catch (error) {
			console.error(`Failed to load clip ${clipId}:`, error);
			throw error;
		}
	}

	play(): void {
		if (!this.isInitialized) return;
		this.transport.start();
	}

	pause(): void {
		if (!this.isInitialized) return;
		this.transport.pause();
	}

	stop(): void {
		if (!this.isInitialized) return;
		this.transport.stop();
		this.transport.position = 0;
	}

	setVolume(clipId: string, volume: number): void {
		const track = this.tracks.get(clipId);
		if (track) {
			// Convert 0-1 range to decibels (-60 to 0)
			const db = volume === 0 ? -Infinity : Tone.gainToDb(volume);
			track.volume.volume.value = db;
		}
	}

	setPan(clipId: string, pan: number): void {
		const track = this.tracks.get(clipId);
		if (track) {
			// Pan range: -1 (left) to 1 (right)
			track.panner.pan.value = pan;
		}
	}

	setMute(clipId: string, muted: boolean): void {
		const track = this.tracks.get(clipId);
		if (track) {
			track.muted = muted;
			track.volume.mute = muted;
		}
	}

	setSolo(clipId: string, solo: boolean): void {
		const track = this.tracks.get(clipId);
		if (!track) return;

		track.solo = solo;

		// Update mute state for all tracks based on solo
		const hasSolo = Array.from(this.tracks.values()).some((t) => t.solo);

		for (const t of this.tracks.values()) {
			if (hasSolo) {
				// If any track is solo, mute all non-solo tracks
				t.volume.mute = !t.solo;
			} else {
				// If no tracks are solo, respect individual mute settings
				t.volume.mute = t.muted;
			}
		}
	}

	toggleEffect(clipId: string, effectType: 'eq' | 'reverb' | 'delay', enabled: boolean): void {
		const track = this.tracks.get(clipId);
		if (!track || !track.player) return;

		if (enabled) {
			// Create and connect the effect
			switch (effectType) {
				case 'eq':
					if (!track.effects.eq) {
						track.effects.eq = new Tone.EQ3({
							low: 0,
							mid: 0,
							high: 0
						});
						track.player.disconnect();
						track.player.connect(track.effects.eq);
						track.effects.eq.connect(track.panner);
					}
					break;
				case 'reverb':
					if (!track.effects.reverb) {
						track.effects.reverb = new Tone.Reverb({
							decay: 2,
							wet: 0.3
						});
						track.player.disconnect();
						track.player.connect(track.effects.reverb);
						track.effects.reverb.connect(track.panner);
					}
					break;
				case 'delay':
					if (!track.effects.delay) {
						track.effects.delay = new Tone.FeedbackDelay({
							delayTime: '8n',
							feedback: 0.3,
							wet: 0.3
						});
						track.player.disconnect();
						track.player.connect(track.effects.delay);
						track.effects.delay.connect(track.panner);
					}
					break;
			}
		} else {
			// Remove the effect
			switch (effectType) {
				case 'eq':
					if (track.effects.eq) {
						track.effects.eq.disconnect();
						track.effects.eq.dispose();
						track.effects.eq = null;
						track.player.disconnect();
						track.player.connect(track.panner);
					}
					break;
				case 'reverb':
					if (track.effects.reverb) {
						track.effects.reverb.disconnect();
						track.effects.reverb.dispose();
						track.effects.reverb = null;
						track.player.disconnect();
						track.player.connect(track.panner);
					}
					break;
				case 'delay':
					if (track.effects.delay) {
						track.effects.delay.disconnect();
						track.effects.delay.dispose();
						track.effects.delay = null;
						track.player.disconnect();
						track.player.connect(track.panner);
					}
					break;
			}
		}
	}

	getPlaybackPosition(): number {
		return this.transport.seconds;
	}

	setPlaybackPosition(seconds: number): void {
		this.transport.seconds = seconds;
	}

	setMasterVolume(volume: number): void {
		const db = volume === 0 ? -Infinity : Tone.gainToDb(volume);
		this.masterChannel.volume.value = db;
	}

	async exportMixdown(duration: number = 30): Promise<Blob> {
		if (!this.isInitialized) {
			await this.init();
		}

		// Create offline context for rendering
		const renderer = Tone.Offline(async () => {
			// All audio processing happens here during the offline render
			// The tracks are already connected to the master channel
		}, duration);

		// Record the audio
		const buffer = await renderer;

		// Convert to WAV format
		const wavBlob = await this.bufferToWav(buffer);

		return wavBlob;
	}

	private async bufferToWav(buffer: Tone.ToneAudioBuffer): Promise<Blob> {
		// Get audio buffer
		const audioBuffer = buffer.get();
		if (!audioBuffer) {
			throw new Error('Failed to get audio buffer');
		}

		// WAV file parameters
		const numberOfChannels = audioBuffer.numberOfChannels;
		const sampleRate = audioBuffer.sampleRate;
		const format = 1; // PCM
		const bitDepth = 16;

		// Calculate sizes
		const bytesPerSample = bitDepth / 8;
		const blockAlign = numberOfChannels * bytesPerSample;
		const byteRate = sampleRate * blockAlign;
		const dataSize = audioBuffer.length * blockAlign;
		const bufferSize = 44 + dataSize;

		// Create WAV file buffer
		const arrayBuffer = new ArrayBuffer(bufferSize);
		const view = new DataView(arrayBuffer);

		// Write WAV header
		const writeString = (offset: number, string: string) => {
			for (let i = 0; i < string.length; i++) {
				view.setUint8(offset + i, string.charCodeAt(i));
			}
		};

		writeString(0, 'RIFF');
		view.setUint32(4, bufferSize - 8, true);
		writeString(8, 'WAVE');
		writeString(12, 'fmt ');
		view.setUint32(16, 16, true); // fmt chunk size
		view.setUint16(20, format, true);
		view.setUint16(22, numberOfChannels, true);
		view.setUint32(24, sampleRate, true);
		view.setUint32(28, byteRate, true);
		view.setUint16(32, blockAlign, true);
		view.setUint16(34, bitDepth, true);
		writeString(36, 'data');
		view.setUint32(40, dataSize, true);

		// Write audio data
		const channels: Float32Array[] = [];
		for (let i = 0; i < numberOfChannels; i++) {
			channels.push(audioBuffer.getChannelData(i));
		}

		let offset = 44;
		for (let i = 0; i < audioBuffer.length; i++) {
			for (let channel = 0; channel < numberOfChannels; channel++) {
				const sample = Math.max(-1, Math.min(1, channels[channel][i]));
				const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
				view.setInt16(offset, int16, true);
				offset += 2;
			}
		}

		return new Blob([arrayBuffer], { type: 'audio/wav' });
	}

	downloadMixdown(blob: Blob, filename: string = 'mixdown.wav'): void {
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		link.click();
		URL.revokeObjectURL(url);
	}

	dispose(): void {
		this.stop();

		// Dispose all tracks
		for (const track of this.tracks.values()) {
			if (track.player) track.player.dispose();
			track.volume.dispose();
			track.panner.dispose();
			if (track.effects.eq) track.effects.eq.dispose();
			if (track.effects.reverb) track.effects.reverb.dispose();
			if (track.effects.delay) track.effects.delay.dispose();
		}

		this.tracks.clear();
		this.masterChannel.dispose();
		this.isInitialized = false;
	}
}

// Export singleton instance
export const audioEngine = new AudioEngine();
