<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { jamAPI, commentAPI, type Jam, type Clip, type Comment, type User } from '$lib/api';
	import { authStore } from '$lib/stores/auth';
	import { audioStore } from '$lib/stores/audio';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import TimelineEditor from '$lib/components/audio/TimelineEditor.svelte';
	import TrackMixer from '$lib/components/audio/TrackMixer.svelte';
	import CollaboratorCursors from '$lib/components/collaboration/CollaboratorCursors.svelte';

	let loading = true;
	let error: string | null = null;

	let jam: Jam | null = null;
	let audioClips: Clip[] = [];
	let collaborators: User[] = [];
	let comments: Comment[] = [];
	let myAvailableClips: Clip[] = [];
	let availableUsers: User[] = [];
	let isOwner = false;

	let commentText = '';
	let isSubmittingComment = false;
	let activeView: 'timeline' | 'mixer' = 'timeline';

	const jamId = $page.params.id;

	async function loadJam() {
		loading = true;
		error = null;

		if (!jamId) {
			error = 'Jam ID is required';
			loading = false;
			return;
		}

		try {
			const data = await jamAPI.getById(jamId);

			jam = data.jam;
			audioClips = data.audioClips;
			collaborators = data.collaborators;
			comments = data.comments;
			myAvailableClips = data.myAvailableClips || [];
			availableUsers = data.availableUsers || [];
			isOwner = data.isOwner;

			// Set the first clip to the global player
			if (jam && audioClips.length > 0) {
				audioStore.setCurrentJam(jam, audioClips[0]);
			}
		} catch (err: unknown) {
			console.error('Failed to load jam:', err);
			error =
				(err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
				'Failed to load jam. Please try again.';
		} finally {
			loading = false;
		}
	}

	async function handleLike() {
		if (!jam) return;

		try {
			await jamAPI.like(jam._id);
			// Reload jam to get updated like count
			await loadJam();
		} catch (err) {
			console.error('Failed to like jam:', err);
		}
	}

	async function handleCommentSubmit(e: Event) {
		e.preventDefault();
		if (!commentText.trim() || !jam) return;

		isSubmittingComment = true;
		try {
			await commentAPI.create(jam._id, commentText);
			commentText = '';
			// Reload to get new comment
			await loadJam();
		} catch (err) {
			console.error('Failed to submit comment:', err);
		} finally {
			isSubmittingComment = false;
		}
	}

	async function handleAddClip(clipId: string) {
		if (!jam) return;

		try {
			await jamAPI.addClip(jam._id, clipId);
			await loadJam(); // Reload to update clips
		} catch (err) {
			console.error('Failed to add clip:', err);
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async function handleRemoveClip(clipId: string) {
		if (!jam || !confirm('Remove this clip from the jam?')) return;

		try {
			await jamAPI.removeClip(jam._id, clipId);
			await loadJam(); // Reload to update clips
		} catch (err) {
			console.error('Failed to remove clip:', err);
		}
	}

	async function handleAddCollaborator(userId: string) {
		if (!jam) return;

		try {
			await jamAPI.addCollaborator(jam._id, userId);
			await loadJam(); // Reload to update collaborators
		} catch (err) {
			console.error('Failed to add collaborator:', err);
		}
	}

	async function handleRemoveCollaborator(userId: string) {
		if (!jam || !confirm('Remove this collaborator from the jam?')) return;

		try {
			await jamAPI.removeCollaborator(jam._id, userId);
			await loadJam(); // Reload to update collaborators
		} catch (err) {
			console.error('Failed to remove collaborator:', err);
		}
	}

	function switchView(view: 'timeline' | 'mixer') {
		activeView = view;
	}

	onMount(() => {
		loadJam();
	});
</script>

<svelte:head>
	<title>{jam ? jam.title : 'Loading...'} - Hit.it</title>
</svelte:head>

{#if jam && jamId}
	<!-- Collaboration Cursors -->
	<CollaboratorCursors {jamId} />
{/if}

<div class="jam-detail-page">
	{#if loading}
		<LoadingSpinner />
	{:else if error}
		<div
			class="error-message mx-auto mt-8 max-w-4xl rounded-lg border border-red-200 bg-red-50 px-6 py-4 text-red-700"
		>
			<p>{error}</p>
			<button on:click={loadJam} class="btn-primary mt-4">Try Again</button>
		</div>
	{:else if jam}
		<!-- Jam Header -->
		<div class="jam-header bg-lime-lighter shadow-card mb-6 flex items-start gap-6 rounded-2xl p-6">
			<img src={jam.image} alt={jam.title} class="h-32 w-32 rounded-xl object-cover shadow-lg" />
			<div class="flex-1">
				<h1 class="text-lime-darkest mb-2 text-4xl font-bold">{jam.title}</h1>
				<p class="mb-4 text-gray-700">{jam.description}</p>
				<div class="flex flex-wrap items-center gap-4">
					<span
						class="bg-lime-dark neon-glow rounded-full px-4 py-2 text-sm font-semibold text-white"
					>
						{jam.genre}
					</span>
					<span class="text-gray-600">{jam.likes} likes</span>
					<span class="text-gray-600">{audioClips.length} clips</span>
					<span class="text-gray-600">{collaborators.length} collaborators</span>
				</div>
				{#if $authStore.isAuthenticated}
					<button on:click={handleLike} class="btn-primary mt-4 flex items-center gap-2">
						Like this Jam
					</button>
				{/if}
			</div>
		</div>

		<!-- View Switcher & Upload Button -->
		<div class="mb-6 flex items-center justify-between">
			<div class="bg-lime-lighter flex gap-2 rounded-lg p-1">
				<button
					class="rounded-lg px-6 py-2 font-semibold transition-all {activeView === 'timeline'
						? 'bg-lime-base text-white shadow-lg'
						: 'text-lime-darkest hover:bg-lime-light'}"
					on:click={() => switchView('timeline')}
				>
					Timeline
				</button>
				<button
					class="rounded-lg px-6 py-2 font-semibold transition-all {activeView === 'mixer'
						? 'bg-lime-base text-white shadow-lg'
						: 'text-lime-darkest hover:bg-lime-light'}"
					on:click={() => switchView('mixer')}
				>
					Mixer
				</button>
			</div>

			{#if isOwner || collaborators.some((c) => c._id === $authStore.user?._id)}
				<button class="btn-primary flex items-center gap-2">
					<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
						<path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
						<path
							d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"
						/>
					</svg>
					Upload Clip
				</button>
			{/if}
		</div>

		<!-- DAW Main Content -->
		{#if activeView === 'timeline'}
			<TimelineEditor clips={audioClips} />
		{:else}
			<TrackMixer clips={audioClips} />
		{/if}

		<!-- Add Clip Section (Owner or Collaborator only) -->
		{#if (isOwner || collaborators.some((c) => c._id === $authStore.user?._id)) && myAvailableClips.length > 0}
			<div class="bg-lime-lighter border-lime-light mt-6 rounded-xl border-2 p-6">
				<h3 class="text-lime-darkest mb-3 font-bold">Add Your Clips</h3>
				<div class="space-y-2">
					{#each myAvailableClips as clip (clip._id)}
						<div class="flex items-center justify-between rounded-lg bg-white p-3">
							<span class="text-lime-darkest font-medium">{clip.title}</span>
							<button on:click={() => handleAddClip(clip._id)} class="add-btn">
								+ Add to Jam
							</button>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Tips & Collaboration Info -->
		<div class="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
			<div class="bg-lime-lighter border-lime-light rounded-xl border-2 p-6">
				<h3 class="text-lime-darkest mb-3 flex items-center gap-2 font-bold">
					<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
							clip-rule="evenodd"
						/>
					</svg>
					Collaboration Tips
				</h3>
				<ul class="space-y-2 text-sm text-gray-700">
					<li>• See other collaborators' cursors in real-time</li>
					<li>• Use M/S buttons to mute/solo tracks</li>
					<li>• Adjust BPM to sync all clips</li>
					<li>• Export your mix when ready</li>
				</ul>
			</div>

			<div class="bg-lime-lighter border-lime-light rounded-xl border-2 p-6">
				<h3 class="text-lime-darkest mb-3 flex items-center gap-2 font-bold">
					<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
						<path
							d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"
						/>
					</svg>
					Keyboard Shortcuts
				</h3>
				<ul class="space-y-2 text-sm text-gray-700">
					<li>
						• <kbd class="bg-lime-dark rounded px-2 py-1 text-xs text-white">Space</kbd> - Play/Pause
					</li>
					<li>
						• <kbd class="bg-lime-dark rounded px-2 py-1 text-xs text-white">M</kbd> - Mute selected
						track
					</li>
					<li>
						• <kbd class="bg-lime-dark rounded px-2 py-1 text-xs text-white">S</kbd> - Solo selected
						track
					</li>
					<li>
						• <kbd class="bg-lime-dark rounded px-2 py-1 text-xs text-white">+/-</kbd> - Zoom in/out
					</li>
				</ul>
			</div>
		</div>

		<!-- Collaborators Section -->
		<section class="bg-lime-lighter border-lime-light mt-8 rounded-xl border-2 p-6">
			<h2 class="text-lime-darkest mb-4 text-2xl font-bold">
				Collaborators ({collaborators.length})
			</h2>
			{#if collaborators.length > 0}
				<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
					{#each collaborators as collaborator (collaborator._id)}
						<div
							class="relative flex flex-col items-center gap-2 rounded-lg bg-white p-4 transition-shadow hover:shadow-lg"
						>
							<img
								src={collaborator.image}
								alt={collaborator.userName}
								class="border-lime-base h-20 w-20 rounded-full border-4 object-cover"
							/>
							<span class="text-lime-darkest text-center font-semibold"
								>{collaborator.userName}</span
							>
							{#if isOwner}
								<button
									on:click={() => handleRemoveCollaborator(collaborator._id)}
									class="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600"
									title="Remove collaborator"
								>
									×
								</button>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<p class="py-8 text-center text-gray-500 italic">
					No collaborators yet. Invite some musicians!
				</p>
			{/if}

			<!-- Add Collaborator Section (Owner only) -->
			{#if isOwner && availableUsers.length > 0}
				<div class="border-lime-base mt-6 border-t-2 pt-6">
					<h3 class="text-lime-darkest mb-3 font-bold">Invite Collaborators</h3>
					<div class="space-y-2">
						{#each availableUsers as user (user._id)}
							<div class="flex items-center justify-between rounded-lg bg-white p-3">
								<div class="flex items-center gap-3">
									<img
										src={user.image}
										alt={user.userName}
										class="border-lime-base h-10 w-10 rounded-full border-2 object-cover"
									/>
									<span class="text-lime-darkest font-medium">{user.userName}</span>
								</div>
								<button on:click={() => handleAddCollaborator(user._id)} class="add-btn">
									+ Invite
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</section>

		<!-- Comments Section -->
		<section class="bg-lime-lighter border-lime-light mt-8 rounded-xl border-2 p-6">
			<h2 class="text-lime-darkest mb-4 text-2xl font-bold">Comments ({comments.length})</h2>

			{#if $authStore.isAuthenticated}
				<form on:submit={handleCommentSubmit} class="mb-6">
					<textarea
						bind:value={commentText}
						placeholder="Add a comment..."
						disabled={isSubmittingComment}
						rows="3"
						class="border-lime-base focus:ring-lime-dark resize-vertical w-full rounded-lg border-2 p-4 focus:ring-2 focus:outline-none"
					></textarea>
					<button
						type="submit"
						disabled={isSubmittingComment || !commentText.trim()}
						class="btn-primary mt-3 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isSubmittingComment ? 'Posting...' : 'Post Comment'}
					</button>
				</form>
			{/if}

			{#if comments.length > 0}
				<div class="space-y-4">
					{#each comments as comment (comment._id)}
						<div class="border-lime-base rounded-lg border bg-white p-4">
							<div class="mb-3 flex items-center gap-3">
								{#if typeof comment.user === 'object' && comment.user !== null}
									<img
										src={comment.user.image}
										alt={comment.user.userName}
										class="border-lime-base h-12 w-12 rounded-full border-2 object-cover"
									/>
									<div>
										<span class="text-lime-darkest block font-semibold"
											>{comment.user.userName}</span
										>
										<span class="text-sm text-gray-500"
											>{new Date(comment.createdAt).toLocaleDateString()}</span
										>
									</div>
								{:else}
									<div
										class="bg-lime-base/20 border-lime-base flex h-12 w-12 items-center justify-center rounded-full border-2"
									>
										<span class="text-lime-darkest font-bold">?</span>
									</div>
									<div>
										<span class="text-lime-darkest block font-semibold">User</span>
										<span class="text-sm text-gray-500"
											>{new Date(comment.createdAt).toLocaleDateString()}</span
										>
									</div>
								{/if}
							</div>
							<p class="mb-3 text-gray-700">{comment.commentText}</p>
							<button class="text-sm text-gray-600 transition-colors hover:text-red-500">
								{comment.likes}
							</button>
						</div>
					{/each}
				</div>
			{:else}
				<p class="py-8 text-center text-gray-500 italic">
					No comments yet. Start the conversation!
				</p>
			{/if}
		</section>
	{/if}
</div>

<style>
	.jam-detail-page {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	.neon-glow {
		box-shadow:
			0 0 10px rgba(88, 175, 59, 0.3),
			0 0 20px rgba(88, 175, 59, 0.2);
	}

	.add-btn {
		background: #28a745;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.add-btn:hover {
		background: #218838;
	}
</style>
