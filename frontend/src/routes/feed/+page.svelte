<script lang="ts">
	import { onMount } from 'svelte';
	import { jamAPI, type Jam } from '$lib/api';
	import JamCard from '$lib/components/JamCard.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import Pagination from '$lib/components/Pagination.svelte';

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

<svelte:head>
	<title>Feed - hit.it</title>
</svelte:head>

<div class="feed-page">
	{#if loading}
		<LoadingSpinner />
	{:else if error}
		<div class="error-message">
			<p>{error}</p>
			<button on:click={() => loadFeed(currentPage)}>Try Again</button>
		</div>
	{:else}
		<!-- Favorite Genres Section -->
		{#if Object.keys(genreFavJams).length > 0}
			<section class="genre-section">
				<div class="section-header">
					<h2 class="section-title">My Favorite Genres</h2>
					<p class="section-subtitle">Discover jams from your favorite genres</p>
				</div>
				<div class="jam-grid">
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
			<section class="genre-section">
				<div class="section-header">
					<h2 class="section-title">Hip-Hop Jams</h2>
					<p class="section-subtitle">Hip-Hop Bangers For You To Check Out!</p>
				</div>
				<div class="jam-grid">
					{#each hipHopJams as jam (jam._id)}
						<JamCard {jam} />
					{/each}
				</div>
			</section>
		{/if}

		<!-- Pop Section -->
		{#if popJams.length > 0}
			<section class="genre-section">
				<div class="section-header">
					<h2 class="section-title">Pop Jams</h2>
					<p class="section-subtitle">Pop Hits For You To Check Out!</p>
				</div>
				<div class="jam-grid">
					{#each popJams as jam (jam._id)}
						<JamCard {jam} />
					{/each}
				</div>
			</section>
		{/if}

		<!-- All Jams Section -->
		<section class="genre-section">
			<div class="section-header">
				<h2 class="section-title">Explore All Jams</h2>
				<p class="section-subtitle">Recently Created Jams</p>
			</div>

			{#if jams.length > 0}
				<div class="jam-grid">
					{#each jams as jam (jam._id)}
						<JamCard {jam} />
					{/each}
				</div>

				<!-- Pagination -->
				<Pagination {currentPage} {totalPages} onPageChange={handlePageChange} />
			{:else}
				<div class="empty-state">
					<p>No jams yet. Be the first to create one!</p>
				</div>
			{/if}
		</section>
	{/if}
</div>

<style>
	.feed-page {
		min-height: 100vh;
		padding: 2rem 1rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	.genre-section {
		margin-bottom: 4rem;
	}

	.section-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.section-title {
		font-size: 2rem;
		font-weight: 700;
		color: #00ff88;
		margin: 0 0 0.5rem 0;
	}

	.section-subtitle {
		font-size: 1rem;
		color: #666;
		margin: 0;
	}

	.jam-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	@media (max-width: 768px) {
		.jam-grid {
			grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
			gap: 1rem;
		}

		.section-title {
			font-size: 1.5rem;
		}
	}

	.error-message {
		text-align: center;
		padding: 3rem;
	}

	.error-message p {
		color: #dc3545;
		margin-bottom: 1rem;
		font-size: 1.1rem;
	}

	.error-message button {
		background: #00ff88;
		color: #000;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.error-message button:hover {
		opacity: 0.8;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: #666;
	}
</style>
