/**
 * Waveform extraction utilities
 * Extracts audio waveform data for visualization
 */

export interface WaveformData {
	peaks: number[]; // Array of normalized peak values (0-1)
	duration: number; // Duration in seconds
}

/**
 * Extract waveform data from an audio URL
 * @param audioUrl - URL of the audio file
 * @param samples - Number of samples to extract (bars in visualization)
 * @returns Promise<WaveformData>
 */
export async function extractWaveform(
	audioUrl: string,
	samples: number = 100
): Promise<WaveformData> {
	try {
		// Fetch the audio file
		const response = await fetch(audioUrl);
		const arrayBuffer = await response.arrayBuffer();

		// Create audio context
		const audioContext = new (window.AudioContext ||
			(window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

		// Decode audio data
		const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

		// Get channel data (use first channel for mono, or mix if stereo)
		const channelData = audioBuffer.getChannelData(0);
		const duration = audioBuffer.duration;

		// Calculate how many samples per bar
		const blockSize = Math.floor(channelData.length / samples);
		const peaks: number[] = [];

		// Extract peak values for each block
		for (let i = 0; i < samples; i++) {
			const start = i * blockSize;
			const end = start + blockSize;
			let max = 0;

			// Find the maximum absolute value in this block
			for (let j = start; j < end && j < channelData.length; j++) {
				const abs = Math.abs(channelData[j]);
				if (abs > max) {
					max = abs;
				}
			}

			// Normalize to 0-1 range
			peaks.push(max);
		}

		// Close audio context to free resources
		audioContext.close();

		return {
			peaks,
			duration
		};
	} catch (error) {
		console.error('Failed to extract waveform:', error);
		// Return fallback random waveform on error
		return {
			peaks: Array.from({ length: samples }, () => Math.random() * 0.8 + 0.2),
			duration: 0
		};
	}
}

/**
 * Cache for waveform data to avoid re-extracting
 */
const waveformCache = new Map<string, WaveformData>();

/**
 * Get waveform data with caching
 * @param audioUrl - URL of the audio file
 * @param samples - Number of samples
 * @returns Promise<WaveformData>
 */
export async function getCachedWaveform(
	audioUrl: string,
	samples: number = 100
): Promise<WaveformData> {
	const cacheKey = `${audioUrl}:${samples}`;

	if (waveformCache.has(cacheKey)) {
		return waveformCache.get(cacheKey)!;
	}

	const waveform = await extractWaveform(audioUrl, samples);
	waveformCache.set(cacheKey, waveform);

	return waveform;
}

/**
 * Clear waveform cache
 */
export function clearWaveformCache(): void {
	waveformCache.clear();
}
