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

<div class="mx-auto min-h-screen max-w-7xl px-4 py-8 md:px-6 md:py-12">
	{#if loading}
		<LoadingSpinner />
	{:else if error}
		<div class="px-4 py-12 text-center">
			<p class="mb-4 text-lg font-medium text-red-500">{error}</p>
			<button
				on:click={() => loadFeed(currentPage)}
				class="bg-accent hover:bg-accent-600 rounded-lg px-6 py-3 font-semibold text-gray-900 transition-all duration-200 hover:shadow-lg"
			>
				Try Again
			</button>
		</div>
	{:else}
		<!-- Favorite Genres Section -->
		{#if Object.keys(genreFavJams).length > 0}
			<section class="mb-16">
				<div class="mb-8 text-center">
					<h2 class="text-primary-deep mb-2 text-3xl font-bold md:text-4xl">My Favorite Genres</h2>
					<p class="text-base text-gray-600 md:text-lg">Discover jams from your favorite genres</p>
				</div>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
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
				<div class="mb-8 text-center">
					<h2 class="text-primary-deep mb-2 text-3xl font-bold md:text-4xl">Hip-Hop Jams</h2>
					<p class="text-base text-gray-600 md:text-lg">Hip-Hop Bangers For You To Check Out!</p>
				</div>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
					{#each hipHopJams as jam (jam._id)}
						<JamCard {jam} />
					{/each}
				</div>
			</section>
		{/if}

		<!-- Pop Section -->
		{#if popJams.length > 0}
			<section class="mb-16">
				<div class="mb-8 text-center">
					<h2 class="text-primary-deep mb-2 text-3xl font-bold md:text-4xl">Pop Jams</h2>
					<p class="text-base text-gray-600 md:text-lg">Pop Hits For You To Check Out!</p>
				</div>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
					{#each popJams as jam (jam._id)}
						<JamCard {jam} />
					{/each}
				</div>
			</section>
		{/if}

		<!-- All Jams Section -->
		<section class="mb-16">
			<div class="mb-8 text-center">
				<h2 class="text-primary-deep mb-2 text-3xl font-bold md:text-4xl">Explore All Jams</h2>
				<p class="text-base text-gray-600 md:text-lg">Recently Created Jams</p>
			</div>

			{#if jams.length > 0}
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
					{#each jams as jam (jam._id)}
						<JamCard {jam} />
					{/each}
				</div>

				<!-- Pagination -->
				<Pagination {currentPage} {totalPages} onPageChange={handlePageChange} />
			{:else}
				<div class="py-12 text-center text-gray-600">
					<p>No jams yet. Be the first to create one!</p>
				</div>
			{/if}
		</section>
	{/if}
</div>
