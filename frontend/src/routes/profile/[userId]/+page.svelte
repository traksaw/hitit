<script lang="ts">
	// import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { authAPI, jamAPI, clipAPI, type User, type Jam, type Clip } from '$lib/api';
	// import { authStore } from '$lib/stores/auth';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import JamCard from '$lib/components/JamCard.svelte';
	import SEO from '$lib/components/SEO.svelte';

	let loading = true;
	let error: string | null = null;

	let user: User | null = null;
	let clips: Clip[] = [];
	let jams: Jam[] = [];
	let collabJams: Jam[] = [];
	let isOwnProfile = false;

	// Get userId from URL parameter
	$: userId = $page.params.userId;

	// Helper function to extract error message
	function getErrorMessage(err: unknown, defaultMessage: string): string {
		if (err && typeof err === 'object' && 'response' in err) {
			const response = (err as Record<string, unknown>).response;
			if (response && typeof response === 'object' && 'data' in response) {
				const data = (response as Record<string, unknown>).data;
				if (data && typeof data === 'object' && 'error' in data) {
					return String((data as Record<string, unknown>).error);
				}
			}
		}
		return defaultMessage;
	}

	async function loadProfile() {
		loading = true;
		error = null;

		try {
			// Fetch the profile using the userId parameter
			const response = await fetch(`/api/profile/${userId}`);

			if (!response.ok) {
				if (response.status === 404) {
					error = 'User not found';
				} else {
					error = 'Failed to load profile';
				}
				return;
			}

			const data = await response.json();

			user = data.user;
			clips = data.clips;
			jams = data.jams;
			collabJams = data.collabJams;
			isOwnProfile = data.isOwnProfile;
		} catch (err: unknown) {
			console.error('Failed to load profile:', err);
			error = getErrorMessage(err, 'Failed to load profile. Please try again.');
		} finally {
			loading = false;
		}
	}

	async function handleDeleteJam(jamId: string) {
		if (!isOwnProfile) return;

		if (!confirm('Are you sure you want to delete this jam? This action cannot be undone.')) {
			return;
		}

		try {
			await jamAPI.delete(jamId);
			// Reload profile to reflect the deletion
			await loadProfile();
		} catch (err: unknown) {
			console.error('Failed to delete jam:', err);
			alert(getErrorMessage(err, 'Failed to delete jam. Please try again.'));
		}
	}

	async function handleDeleteClip(clipId: string) {
		if (!isOwnProfile) return;

		if (!confirm('Are you sure you want to delete this clip? This action cannot be undone.')) {
			return;
		}

		try {
			await clipAPI.delete(clipId);
			// Reload profile to reflect the deletion
			await loadProfile();
		} catch (err: unknown) {
			console.error('Failed to delete clip:', err);
			alert(getErrorMessage(err, 'Failed to delete clip. Please try again.'));
		}
	}

	// Reload profile when userId changes
	$: if (userId) {
		loadProfile();
	}
</script>

<SEO
	title={user ? `${user.userName}'s Profile` : 'Profile'}
	description={user
		? `View ${user.userName}'s music jams, audio clips, and collaborations on Hit.it.`
		: 'View user profile on Hit.it.'}
/>

{#if loading}
	<div class="flex min-h-screen items-center justify-center">
		<LoadingSpinner />
	</div>
{:else if error}
	<div class="flex min-h-screen items-center justify-center p-4">
		<div class="max-w-md rounded-lg bg-red-50 p-6 text-center">
			<h2 class="mb-2 text-xl font-bold text-red-800">Error</h2>
			<p class="text-red-600">{error}</p>
			<a href="/feed" class="btn-primary mt-4 inline-block"> Back to Feed </a>
		</div>
	</div>
{:else if user}
	<div class="min-h-screen p-4 pb-32 md:p-8">
		<div class="mx-auto max-w-6xl">
			<!-- Profile Header -->
			<div class="card mb-8 overflow-visible p-6 md:p-8">
				<div class="flex flex-col items-center gap-6 md:flex-row md:items-start">
					<img
						src={user.image}
						alt={user.userName}
						class="h-32 w-32 rounded-full border-4 border-white object-cover shadow-lg"
					/>
					<div class="flex-1 text-center md:text-left">
						<h1 class="mb-2 text-3xl font-bold text-gray-800 md:text-4xl">
							{user.userName}
						</h1>
						{#if isOwnProfile && user.email}
							<p class="mb-4 text-gray-600">{user.email}</p>
						{/if}
						{#if user.favoriteGenres && user.favoriteGenres.length > 0}
							<div class="mb-4">
								<p class="mb-2 text-sm font-semibold text-gray-700">Favorite Genres:</p>
								<div class="flex flex-wrap justify-center gap-2 md:justify-start">
									{#each user.favoriteGenres as genre}
										<span
											class="bg-primary-dark rounded-full px-3 py-1 text-xs font-semibold text-white"
										>
											{genre}
										</span>
									{/each}
								</div>
							</div>
						{/if}
						<div
							class="flex flex-wrap justify-center gap-6 text-center md:justify-start md:text-left"
						>
							<div>
								<p class="text-2xl font-bold text-gray-800">{jams.length}</p>
								<p class="text-sm text-gray-600">Jams</p>
							</div>
							<div>
								<p class="text-2xl font-bold text-gray-800">{clips.length}</p>
								<p class="text-sm text-gray-600">Clips</p>
							</div>
							<div>
								<p class="text-2xl font-bold text-gray-800">{collabJams.length}</p>
								<p class="text-sm text-gray-600">Collaborations</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Action Buttons (only show for own profile) -->
			{#if isOwnProfile}
				<div class="mb-8 flex flex-wrap justify-center gap-4 md:justify-start">
					<a href="/create-jam" class="btn-primary">Create New Jam</a>
					<a href="/upload-clip" class="btn-secondary">Upload Clip</a>
				</div>
			{/if}

			<!-- Tabs -->
			<div class="mb-6">
				<div class="border-b border-gray-300">
					<nav class="-mb-px flex gap-8">
						<button class="border-primary-deep border-b-2 px-1 py-4 text-sm font-medium">
							My Jams ({jams.length})
						</button>
					</nav>
				</div>
			</div>

			<!-- My Jams Grid -->
			<div class="mb-12">
				{#if jams.length === 0}
					<div class="card p-8 text-center">
						<p class="text-gray-600">
							{isOwnProfile
								? "You haven't created any jams yet."
								: `${user.userName} hasn't created any public jams yet.`}
						</p>
						{#if isOwnProfile}
							<a href="/create-jam" class="btn-primary mt-4 inline-block">Create Your First Jam</a>
						{/if}
					</div>
				{:else}
					<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{#each jams as jam (jam._id)}
							<div class="relative">
								<JamCard {jam} />
								{#if isOwnProfile}
									<button
										on:click={() => handleDeleteJam(jam._id)}
										class="absolute top-2 right-2 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-red-600"
										title="Delete jam"
									>
										Delete
									</button>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Collaboration Jams -->
			{#if collabJams.length > 0}
				<div class="mb-12">
					<h2 class="mb-6 text-2xl font-bold text-gray-800">
						{isOwnProfile ? 'Collaboration Jams' : `${user.userName}'s Collaborations`}
					</h2>
					<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{#each collabJams as jam (jam._id)}
							<JamCard {jam} />
						{/each}
					</div>
				</div>
			{/if}

			<!-- Audio Clips -->
			{#if clips.length > 0}
				<div class="mb-12">
					<h2 class="mb-6 text-2xl font-bold text-gray-800">
						{isOwnProfile ? 'My Audio Clips' : `${user.userName}'s Clips`}
					</h2>
					<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{#each clips as clip (clip._id)}
							<div class="card relative overflow-hidden p-4">
								<h5 class="mb-2 text-lg font-semibold text-gray-800">{clip.title}</h5>
								<p class="mb-4 line-clamp-2 text-sm text-gray-700">{clip.description}</p>
								<audio controls class="w-full">
									<source src={clip.audio} type="audio/mpeg" />
									Your browser does not support the audio element.
								</audio>
								{#if isOwnProfile}
									<button
										on:click={() => handleDeleteClip(clip._id)}
										class="mt-4 w-full rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-600"
									>
										Delete Clip
									</button>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
