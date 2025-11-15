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
		} catch (err: any) {
			console.error('Failed to create jam:', err);
			error = err.response?.data?.error || 'Failed to create jam. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<SEO title="Create New Jam" description="Start a new collaborative music jam on Hit.it. Share your vision and invite other musicians to collaborate." />

<div class="min-h-screen p-4 md:p-8 bg-primary-light flex justify-center items-center">
	<div class="bg-white rounded-2xl p-8 md:p-10 w-full max-w-2xl shadow-2xl">
		<h1 class="text-3xl md:text-4xl font-bold text-gray-800 text-center mb-2">Create a New Jam</h1>
		<p class="text-gray-600 text-center mb-8 text-sm md:text-base">Start a collaborative music project</p>

		{#if error}
			<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm" role="alert">
				{error}
			</div>
		{/if}

		<form on:submit={handleSubmit} enctype="multipart/form-data" class="space-y-6">
			<div>
				<label for="title" class="block mb-2 text-gray-700 font-medium text-sm">Jam Title *</label>
				<input
					type="text"
					id="title"
					bind:value={title}
					placeholder="Give your jam a catchy name"
					required
					disabled={isSubmitting}
					class="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
				/>
			</div>

			<div>
				<label for="genre" class="block mb-2 text-gray-700 font-medium text-sm">Genre *</label>
				<select
					id="genre"
					bind:value={genre}
					required
					disabled={isSubmitting}
					class="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
				>
					<option value="">Select a genre</option>
					{#each genres as genreOption}
						<option value={genreOption}>{genreOption}</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="description" class="block mb-2 text-gray-700 font-medium text-sm">Description</label>
				<textarea
					id="description"
					bind:value={description}
					placeholder="Describe your jam, the vibe, or what you're looking for..."
					rows="4"
					disabled={isSubmitting}
					class="input-field resize-y disabled:bg-gray-100 disabled:cursor-not-allowed"
				></textarea>
			</div>

			<div>
				<label for="image" class="block mb-2 text-gray-700 font-medium text-sm">Cover Image *</label>
				<input
					type="file"
					id="image"
					accept="image/*"
					on:change={handleFileChange}
					required
					disabled={isSubmitting}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm transition-colors focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-gray-100 disabled:cursor-not-allowed"
				/>
				{#if imagePreview}
					<div class="mt-4 rounded-lg overflow-hidden shadow-md">
						<img src={imagePreview} alt="Preview" class="w-full max-h-80 object-cover" />
					</div>
				{/if}
			</div>

			<div class="flex flex-col sm:flex-row gap-4 mt-8">
				<button
					type="button"
					on:click={() => goto('/profile')}
					disabled={isSubmitting}
					class="flex-1 py-3 px-4 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
				>
					Cancel
				</button>
				<button
					type="submit"
					class="btn-primary flex-1 py-3 px-4 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
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
