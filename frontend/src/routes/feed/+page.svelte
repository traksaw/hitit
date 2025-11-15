<script lang="ts">
	import { onMount } from 'svelte';
	import { jamAPI, type Jam } from '$lib/api';
	import JamCard from '$lib/components/JamCard.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import SEO from '$lib/components/SEO.svelte';

	let loading = true;
	let error: string | null = null;
	let jams: Jam[] = [];
	let hipHopJams: Jam[] = [];
	let popJams: Jam[] = [];
	let genreFavJams: Record<string, Jam[]> = {};
	let currentPage = 1;
	let totalPages = 1;

	async function loadFeed(page: number = 1) {
		loading = true;
		error = null;

		try {
			const feedData = await jamAPI.getFeed(page);

			jams = feedData.jams;
			hipHopJams = feedData.hipHopJams || [];
			popJams = feedData.popJams || [];
			genreFavJams = feedData.genreFavJams || {};
			currentPage = feedData.currentPage;
			totalPages = feedData.totalPages;
		} catch (err) {
			console.error('Failed to load feed:', err);
			error = 'Failed to load jams. Please try again later.';
		} finally {
			loading = false;
		}
	}

	function handlePageChange(page: number) {
		currentPage = page;
		loadFeed(page);
		// Scroll to top
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	onMount(() => {
		loadFeed(1);
	});
</script>

<SEO
	title="Feed"
	description="Discover amazing music jams from talented creators. Explore Hip-Hop, Pop, Jazz, and more collaborative music projects on Hit.it."
/>

<div class="min-h-screen py-8 px-4 md:py-12 md:px-6 max-w-7xl mx-auto">
	{#if loading}
		<LoadingSpinner />
	{:else if error}
		<div class="text-center py-12 px-4">
			<p class="text-red-500 mb-4 text-lg font-medium">{error}</p>
			<button
				on:click={() => loadFeed(currentPage)}
				class="bg-accent hover:bg-accent-600 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg"
			>
				Try Again
			</button>
		</div>
	{:else}
		<!-- Favorite Genres Section -->
		{#if Object.keys(genreFavJams).length > 0}
			<section class="mb-16">
				<div class="text-center mb-8">
					<h2 class="text-3xl md:text-4xl font-bold text-primary-deep mb-2">My Favorite Genres</h2>
					<p class="text-gray-600 text-base md:text-lg">Discover jams from your favorite genres</p>
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
					{#each Object.entries(genreFavJams) as [genre, genreJams] (genre)}
						{#each genreJams as jam (jam._id)}
							<JamCard {jam} />
						{/each}
					{/each}
				</div>
			</section>
		{/if}

		<!-- Hip-Hop Section -->
		{#if hipHopJams.length > 0}
			<section class="mb-16">
				<div class="text-center mb-8">
					<h2 class="text-3xl md:text-4xl font-bold text-primary-deep mb-2">Hip-Hop Jams</h2>
					<p class="text-gray-600 text-base md:text-lg">Hip-Hop Bangers For You To Check Out!</p>
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
					{#each hipHopJams as jam (jam._id)}
						<JamCard {jam} />
					{/each}
				</div>
			</section>
		{/if}

		<!-- Pop Section -->
		{#if popJams.length > 0}
			<section class="mb-16">
				<div class="text-center mb-8">
					<h2 class="text-3xl md:text-4xl font-bold text-primary-deep mb-2">Pop Jams</h2>
					<p class="text-gray-600 text-base md:text-lg">Pop Hits For You To Check Out!</p>
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
					{#each popJams as jam (jam._id)}
						<JamCard {jam} />
					{/each}
				</div>
			</section>
		{/if}

		<!-- All Jams Section -->
		<section class="mb-16">
			<div class="text-center mb-8">
				<h2 class="text-3xl md:text-4xl font-bold text-primary-deep mb-2">Explore All Jams</h2>
				<p class="text-gray-600 text-base md:text-lg">Recently Created Jams</p>
			</div>

			{#if jams.length > 0}
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
					{#each jams as jam (jam._id)}
						<JamCard {jam} />
					{/each}
				</div>

				<!-- Pagination -->
				<Pagination {currentPage} {totalPages} onPageChange={handlePageChange} />
			{:else}
				<div class="text-center py-12 text-gray-600">
					<p>No jams yet. Be the first to create one!</p>
				</div>
			{/if}
		</section>
	{/if}
</div>
