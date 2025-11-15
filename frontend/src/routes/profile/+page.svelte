<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authAPI, jamAPI, clipAPI, type User, type Jam, type Clip } from '$lib/api';
	import { authStore } from '$lib/stores/auth';
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

	async function loadProfile() {
		// Check if user is authenticated first
		if (!$authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		loading = true;
		error = null;

		try {
			const data = await authAPI.getProfileData();

			user = data.user;
			clips = data.clips;
			jams = data.jams;
			collabJams = data.collabJams;
			isOwnProfile = data.isOwnProfile;
		} catch (err: any) {
			console.error('Failed to load profile:', err);
			error = err.response?.data?.error || 'Failed to load profile. Please try again.';
		} finally {
			loading = false;
		}
	}

	async function handleDeleteJam(jamId: string) {
		if (!confirm('Are you sure you want to delete this jam? This action cannot be undone.')) {
			return;
		}

		try {
			await jamAPI.delete(jamId);
			// Reload profile to reflect the deletion
			await loadProfile();
		} catch (err: any) {
			console.error('Failed to delete jam:', err);
			alert(err.response?.data?.error || 'Failed to delete jam. Please try again.');
		}
	}

	async function handleDeleteClip(clipId: string) {
		if (!confirm('Are you sure you want to delete this clip? This action cannot be undone.')) {
			return;
		}

		try {
			await clipAPI.delete(clipId);
			// Reload profile to reflect the deletion
			await loadProfile();
		} catch (err: any) {
			console.error('Failed to delete clip:', err);
			alert(err.response?.data?.error || 'Failed to delete clip. Please try again.');
		}
	}

	onMount(() => {
		loadProfile();
	});
</script>

<SEO
	title={user ? `${user.userName}'s Profile` : 'Profile'}
	description={user ? `View ${user.userName}'s music jams, audio clips, and collaborations on Hit.it.` : 'View your profile on Hit.it.'}
/>

<div class="profile-page">
	{#if loading}
		<LoadingSpinner />
	{:else if error}
		<div class="error-message">
			<p>{error}</p>
			<button on:click={loadProfile}>Try Again</button>
		</div>
	{:else if user}
		<!-- Profile Header -->
		<div class="profile-header">
			<div class="profile-avatar">
				<img src={user.image} alt={user.userName} />
			</div>
			<div class="profile-info">
				<h1>{user.userName}</h1>
				<p class="profile-email">{user.email}</p>
				<div class="profile-genres">
					<span class="label">Favorite Genres:</span>
					{#each user.favoriteGenres as genre}
						<span class="genre-badge">{genre}</span>
					{/each}
				</div>
				<div class="profile-stats">
					<div class="stat">
						<span class="stat-number">{jams.length}</span>
						<span class="stat-label">Jams Created</span>
					</div>
					<div class="stat">
						<span class="stat-number">{collabJams.length}</span>
						<span class="stat-label">Collaborations</span>
					</div>
					<div class="stat">
						<span class="stat-number">{clips.length}</span>
						<span class="stat-label">Audio Clips</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Tabs -->
		<div class="tabs">
			<button class="tab active">My Jams</button>
			<button class="tab">Collaborations</button>
			<button class="tab">My Clips</button>
		</div>

		<!-- My Jams Section -->
		<section class="content-section">
			<div class="section-header">
				<h2>My Jams ({jams.length})</h2>
				{#if isOwnProfile}
					<a href="/create-jam" class="create-btn">+ Create New Jam</a>
				{/if}
			</div>

			{#if jams.length > 0}
				<div class="jams-grid">
					{#each jams as jam (jam._id)}
						<div class="jam-card-wrapper">
							<a href="/jam/{jam._id}" class="jam-card">
								<div class="card">
									<div class="card-img">
										<img src={jam.image} alt={jam.title} />
									</div>
									<div class="card-body">
										<h5 class="card-title">{jam.title}</h5>
										<p class="card-description">{jam.description || ''}</p>
										<div class="card-meta">
											<span class="genre">{jam.genre}</span>
											<span class="likes">❤️ {jam.likes}</span>
										</div>
									</div>
								</div>
							</a>
							{#if isOwnProfile}
								<button
									class="delete-btn"
									on:click={() => handleDeleteJam(jam._id)}
									title="Delete this jam"
								>
									🗑️ Delete
								</button>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<div class="empty-state">
					<p>No jams created yet.</p>
					{#if isOwnProfile}
						<a href="/create-jam" class="create-link">Create your first jam!</a>
					{/if}
				</div>
			{/if}
		</section>

		<!-- Collaborations Section -->
		<section class="content-section">
			<h2>Collaborations ({collabJams.length})</h2>

			{#if collabJams.length > 0}
				<div class="jams-grid">
					{#each collabJams as jam (jam._id)}
						<JamCard {jam} />
					{/each}
				</div>
			{:else}
				<div class="empty-state">
					<p>No collaborations yet. Join a jam to start collaborating!</p>
				</div>
			{/if}
		</section>

		<!-- Audio Clips Section -->
		<section class="content-section">
			<div class="section-header">
				<h2>My Audio Clips ({clips.length})</h2>
				{#if isOwnProfile}
					<a href="/upload-clip" class="create-btn">+ Upload Clip</a>
				{/if}
			</div>

			{#if clips.length > 0}
				<div class="clips-list">
					{#each clips as clip (clip._id)}
						<div class="clip-card">
							<div class="clip-header">
								<div class="clip-info">
									<h3>{clip.title}</h3>
									{#if clip.description}
										<p class="clip-description">{clip.description}</p>
									{/if}
								</div>
								{#if isOwnProfile}
									<button
										class="delete-btn delete-btn-small"
										on:click={() => handleDeleteClip(clip._id)}
										title="Delete this clip"
									>
										🗑️ Delete
									</button>
								{/if}
							</div>
							<audio controls src={clip.audio}>
								<track kind="captions" />
								Your browser does not support the audio element.
							</audio>
						</div>
					{/each}
				</div>
			{:else}
				<div class="empty-state">
					<p>No audio clips yet.</p>
					{#if isOwnProfile}
						<a href="/upload-clip" class="create-link">Upload your first clip!</a>
					{/if}
				</div>
			{/if}
		</section>
	{/if}
</div>

<style>
	.profile-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem 1rem;
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
	}

	.profile-header {
		display: grid;
		grid-template-columns: 200px 1fr;
		gap: 2rem;
		background: white;
		padding: 2rem;
		border-radius: 1rem;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.profile-avatar img {
		width: 200px;
		height: 200px;
		border-radius: 50%;
		object-fit: cover;
		border: 4px solid #667eea;
	}

	.profile-info h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2.5rem;
		color: #333;
	}

	.profile-email {
		color: #666;
		margin: 0 0 1rem 0;
		font-size: 1.1rem;
	}

	.profile-genres {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
	}

	.label {
		font-weight: 600;
		color: #666;
	}

	.genre-badge {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 0.4rem 0.8rem;
		border-radius: 1rem;
		font-size: 0.85rem;
		font-weight: 600;
	}

	.profile-stats {
		display: flex;
		gap: 2rem;
		margin-top: 1.5rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.stat-number {
		font-size: 2rem;
		font-weight: 700;
		color: #667eea;
	}

	.stat-label {
		font-size: 0.9rem;
		color: #666;
	}

	.tabs {
		display: none; /* Hidden for now, can be implemented later */
	}

	.content-section {
		background: white;
		padding: 2rem;
		border-radius: 1rem;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.content-section h2 {
		margin: 0 0 1.5rem 0;
		color: #333;
		font-size: 1.75rem;
	}

	.create-btn {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: 600;
		text-decoration: none;
		transition: transform 0.2s;
		display: inline-block;
	}

	.create-btn:hover {
		transform: translateY(-2px);
	}

	.jams-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.clips-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.clip-card {
		background: #f8f9fa;
		padding: 1.5rem;
		border-radius: 0.5rem;
		border: 1px solid #e9ecef;
	}

	.clip-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.clip-info {
		flex: 1;
	}

	.clip-info h3 {
		margin: 0 0 0.5rem 0;
		color: #333;
		font-size: 1.25rem;
	}

	.clip-description {
		color: #666;
		margin: 0;
		font-size: 0.9rem;
	}

	audio {
		width: 100%;
		margin-top: 0.5rem;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: #999;
	}

	.empty-state p {
		margin-bottom: 1rem;
		font-size: 1.1rem;
	}

	.create-link {
		color: #667eea;
		text-decoration: none;
		font-weight: 600;
		font-size: 1.1rem;
	}

	.create-link:hover {
		text-decoration: underline;
	}

	/* Jam Card Wrapper and Styles */
	.jam-card-wrapper {
		position: relative;
	}

	.jam-card {
		display: block;
		text-decoration: none;
		color: inherit;
		transition: transform 0.2s ease;
	}

	.jam-card:hover {
		transform: translateY(-4px);
	}

	.card {
		background: #fff;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transition: box-shadow 0.2s ease;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.jam-card:hover .card {
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
	}

	.card-img {
		width: 100%;
		height: 200px;
		overflow: hidden;
		background: #f0f0f0;
	}

	.card-img img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.card-body {
		padding: 1rem;
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.card-title {
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
		color: #667eea;
	}

	.card-description {
		font-size: 0.875rem;
		color: #666;
		margin: 0 0 1rem 0;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.card-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.875rem;
		margin-top: auto;
	}

	.genre {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-weight: 600;
		font-size: 0.75rem;
	}

	.likes {
		color: #666;
	}

	/* Delete Buttons */
	.delete-btn {
		background: #dc3545;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		margin-top: 0.75rem;
		width: 100%;
	}

	.delete-btn:hover {
		background: #c82333;
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
	}

	.delete-btn:active {
		transform: translateY(0);
	}

	.delete-btn-small {
		width: auto;
		margin-top: 0;
		padding: 0.5rem 0.875rem;
		font-size: 0.85rem;
		flex-shrink: 0;
	}

	@media (max-width: 768px) {
		.profile-header {
			grid-template-columns: 1fr;
			text-align: center;
		}

		.profile-avatar {
			margin: 0 auto;
		}

		.profile-genres {
			justify-content: center;
		}

		.profile-stats {
			justify-content: center;
		}

		.section-header {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}

		.jams-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
