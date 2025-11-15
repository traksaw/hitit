<script lang="ts">
	import { goto } from '$app/navigation';
	import { jamAPI } from '$lib/api';
	import { authStore } from '$lib/stores/auth';
	import SEO from '$lib/components/SEO.svelte';

	let title = '';
	let description = '';
	let genre = '';
	let imageFile: File | null = null;
	let imagePreview: string | null = null;
	let error = '';
	let isSubmitting = false;

	const genres = ['Hip-Hop', 'Rock', 'Pop', 'Jazz', 'Classical', 'Electronic', 'R&B', 'Country'];

	function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			imageFile = target.files[0];

			// Create preview
			const reader = new FileReader();
			reader.onload = (e) => {
				imagePreview = e.target?.result as string;
			};
			reader.readAsDataURL(imageFile);
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

		if (!genre) {
			error = 'Please select a genre';
			return;
		}

		if (!imageFile) {
			error = 'Please upload a cover image';
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
			formData.append('genre', genre);
			formData.append('file', imageFile);

			await jamAPI.create(formData);

			// Redirect to profile after successful creation
			goto('/profile');
		} catch (err: unknown) {
			console.error('Failed to create jam:', err);
			error =
				(err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
				'Failed to create jam. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<SEO
	title="Create New Jam"
	description="Start a new collaborative music jam on Hit.it. Share your vision and invite other musicians to collaborate."
/>

<div class="bg-primary-light flex min-h-screen items-center justify-center p-4 md:p-8">
	<div class="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl md:p-10">
		<h1 class="mb-2 text-center text-3xl font-bold text-gray-800 md:text-4xl">Create a New Jam</h1>
		<p class="mb-8 text-center text-sm text-gray-600 md:text-base">
			Start a collaborative music project
		</p>

		{#if error}
			<div
				class="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
				role="alert"
			>
				{error}
			</div>
		{/if}

		<form on:submit={handleSubmit} enctype="multipart/form-data" class="space-y-6">
			<div>
				<label for="title" class="mb-2 block text-sm font-medium text-gray-700">Jam Title *</label>
				<input
					type="text"
					id="title"
					bind:value={title}
					placeholder="Give your jam a catchy name"
					required
					disabled={isSubmitting}
					class="input-field disabled:cursor-not-allowed disabled:bg-gray-100"
				/>
			</div>

			<div>
				<label for="genre" class="mb-2 block text-sm font-medium text-gray-700">Genre *</label>
				<select
					id="genre"
					bind:value={genre}
					required
					disabled={isSubmitting}
					class="input-field disabled:cursor-not-allowed disabled:bg-gray-100"
				>
					<option value="">Select a genre</option>
					{#each genres as genreOption (genreOption)}
						<option value={genreOption}>{genreOption}</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="description" class="mb-2 block text-sm font-medium text-gray-700"
					>Description</label
				>
				<textarea
					id="description"
					bind:value={description}
					placeholder="Describe your jam, the vibe, or what you're looking for..."
					rows="4"
					disabled={isSubmitting}
					class="input-field resize-y disabled:cursor-not-allowed disabled:bg-gray-100"
				></textarea>
			</div>

			<div>
				<label for="image" class="mb-2 block text-sm font-medium text-gray-700">Cover Image *</label
				>
				<input
					type="file"
					id="image"
					accept="image/*"
					on:change={handleFileChange}
					required
					disabled={isSubmitting}
					class="focus:border-primary focus:ring-primary/20 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
				/>
				{#if imagePreview}
					<div class="mt-4 overflow-hidden rounded-lg shadow-md">
						<img src={imagePreview} alt="Preview" class="max-h-80 w-full object-cover" />
					</div>
				{/if}
			</div>

			<div class="mt-8 flex flex-col gap-4 sm:flex-row">
				<button
					type="button"
					on:click={() => goto('/profile')}
					disabled={isSubmitting}
					class="flex-1 rounded-lg border-2 border-gray-300 px-4 py-3 font-semibold text-gray-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 disabled:transform-none disabled:cursor-not-allowed disabled:opacity-60"
				>
					Cancel
				</button>
				<button
					type="submit"
					class="btn-primary flex-1 px-4 py-3 disabled:transform-none disabled:cursor-not-allowed disabled:opacity-60"
					disabled={isSubmitting}
				>
					{#if isSubmitting}
						Creating Jam...
					{:else}
						Create Jam
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>
