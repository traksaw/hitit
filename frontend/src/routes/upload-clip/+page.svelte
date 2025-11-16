<script lang="ts">
	import { goto } from '$app/navigation';
	import { clipAPI } from '$lib/api';
	import { authStore } from '$lib/stores/auth';
	import SEO from '$lib/components/SEO.svelte';

	let title = '';
	let description = '';
	let audioFile: File | null = null;
	let audioFileName = '';
	let error = '';
	let isSubmitting = false;

	function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			audioFile = target.files[0];
			audioFileName = audioFile.name;
		}
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		error = '';

		// Validation
		if (!title.trim()) {
			error = 'Please enter a title';
			return;
		}

		if (!audioFile) {
			error = 'Please upload an audio file';
			return;
		}

		// Validate file type
		const validTypes = [
			'audio/mpeg',
			'audio/wav',
			'audio/mp3',
			'audio/ogg',
			'audio/webm',
			'audio/x-m4a'
		];
		if (
			!validTypes.includes(audioFile.type) &&
			!audioFile.name.match(/\.(mp3|wav|ogg|webm|m4a)$/i)
		) {
			error = 'Please upload a valid audio file (MP3, WAV, OGG, WebM, or M4A)';
			return;
		}

		// Validate file size (max 50MB)
		if (audioFile.size > 50 * 1024 * 1024) {
			const fileSizeMB = (audioFile.size / (1024 * 1024)).toFixed(2);
			error = `Audio file is too large (${fileSizeMB}MB). Maximum size is 50MB.`;
			return;
		}

		if (!$authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		isSubmitting = true;

		try {
			// Create FormData for multipart/form-data submission
			const formData = new FormData();
			formData.append('title', title);
			formData.append('description', description);
			formData.append('file', audioFile);

			await clipAPI.create(formData);

			// Redirect to profile after successful upload
			goto('/profile');
		} catch (err: unknown) {
			console.error('Failed to upload clip:', err);

			// Extract detailed error message from backend response
			const backendError =
				err && typeof err === 'object' && 'response' in err
					? (err.response as { data?: unknown })?.data
					: null;

			if (backendError && typeof backendError === 'object') {
				// Use the detailed message from backend
				const errorObj = backendError as Record<string, unknown>;
				error =
					(errorObj.message as string) ||
					(errorObj.error as string) ||
					'Failed to upload clip. Please try again.';

				// Add additional context if available
				if (errorObj.receivedType) {
					error += ` (Received file type: ${errorObj.receivedType})`;
				} else if (errorObj.actualSize && errorObj.maxSize) {
					const actualMB = (Number(errorObj.actualSize) / (1024 * 1024)).toFixed(2);
					const maxMB = (Number(errorObj.maxSize) / (1024 * 1024)).toFixed(2);
					error += ` (Your file: ${actualMB}MB, Max: ${maxMB}MB)`;
				}
			} else if (err && typeof err === 'object' && 'message' in err) {
				// Network error or other client-side error
				const message = String(err.message);
				error = message.includes('Network')
					? 'Network error. Please check your connection and try again.'
					: 'Failed to upload clip. Please try again.';
			} else {
				error = 'An unexpected error occurred. Please try again.';
			}
		} finally {
			isSubmitting = false;
		}
	}
</script>

<SEO
	title="Upload Audio Clip"
	description="Upload your audio clips to Hit.it. Share your music with the community and use them in collaborative jams."
/>

<div class="upload-clip-page">
	<div class="form-container">
		<h1>Upload Audio Clip</h1>
		<p class="subtitle">Share your musical creation with the community</p>

		{#if error}
			<div class="error-message" role="alert">
				{error}
			</div>
		{/if}

		<form on:submit={handleSubmit} enctype="multipart/form-data">
			<div class="form-group">
				<label for="title">Clip Title *</label>
				<input
					type="text"
					id="title"
					bind:value={title}
					placeholder="Name your audio clip"
					required
					disabled={isSubmitting}
				/>
			</div>

			<div class="form-group">
				<label for="description">Description</label>
				<textarea
					id="description"
					bind:value={description}
					placeholder="Describe your clip, instruments used, BPM, key, etc..."
					rows="4"
					disabled={isSubmitting}
				></textarea>
			</div>

			<div class="form-group">
				<label for="audio">Audio File *</label>
				<div class="file-input-wrapper">
					<input
						type="file"
						id="audio"
						accept="audio/*,.mp3,.wav,.ogg,.webm"
						on:change={handleFileChange}
						required
						disabled={isSubmitting}
					/>
				</div>
				{#if audioFileName}
					<div class="file-info">
						<span class="file-name">{audioFileName}</span>
					</div>
				{/if}
				<small class="help-text">Supported formats: MP3, WAV, OGG, WebM, M4A (Max 50MB)</small>
			</div>

			<div class="form-actions">
				<button type="button" on:click={() => goto('/profile')} disabled={isSubmitting}>
					Cancel
				</button>
				<button type="submit" class="btn-primary" disabled={isSubmitting}>
					{#if isSubmitting}
						Uploading...
					{:else}
						Upload Clip
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>

<style>
	.upload-clip-page {
		min-height: 100vh;
		padding: 2rem 1rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.form-container {
		background: white;
		border-radius: 1rem;
		padding: 2.5rem;
		width: 100%;
		max-width: 600px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}

	h1 {
		margin: 0 0 0.5rem 0;
		color: #333;
		font-size: 2rem;
		text-align: center;
	}

	.subtitle {
		margin: 0 0 2rem 0;
		color: #666;
		text-align: center;
		font-size: 0.95rem;
	}

	.error-message {
		background-color: #fee;
		border: 1px solid #fcc;
		color: #c33;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1.5rem;
		font-size: 0.9rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		color: #333;
		font-weight: 500;
		font-size: 0.9rem;
	}

	input[type='text'],
	textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 0.5rem;
		font-size: 1rem;
		font-family: inherit;
		transition: border-color 0.2s;
		box-sizing: border-box;
	}

	.file-input-wrapper {
		position: relative;
	}

	input[type='file'] {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 0.5rem;
		font-size: 0.9rem;
		box-sizing: border-box;
		cursor: pointer;
	}

	input:focus,
	textarea:focus {
		outline: none;
		border-color: #667eea;
	}

	input:disabled,
	textarea:disabled {
		background-color: #f5f5f5;
		cursor: not-allowed;
	}

	textarea {
		resize: vertical;
	}

	.file-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.75rem;
		padding: 0.75rem;
		background: #f8f9fa;
		border-radius: 0.5rem;
		border: 1px solid #e9ecef;
	}

	.file-name {
		color: #333;
		font-weight: 500;
		word-break: break-word;
	}

	.help-text {
		display: block;
		margin-top: 0.5rem;
		color: #666;
		font-size: 0.85rem;
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		margin-top: 2rem;
	}

	.form-actions button {
		flex: 1;
		padding: 0.875rem;
		border: 1px solid #ddd;
		border-radius: 0.5rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.form-actions button:hover:not(:disabled) {
		transform: translateY(-2px);
	}

	.form-actions button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.btn-primary {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none !important;
	}

	.btn-primary:hover:not(:disabled) {
		box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
	}
</style>
