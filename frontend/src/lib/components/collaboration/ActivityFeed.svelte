<script lang="ts">
	import type { JamActivity } from '$lib/api/types';
	import { formatDistanceToNow } from 'date-fns';
	import LoadingSpinner from '../LoadingSpinner.svelte';

	interface Props {
		jamId?: string;
		showJamInfo?: boolean;
		limit?: number;
	}

	let { jamId = undefined, showJamInfo = false, limit = 20 }: Props = $props();

	const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

	let activities = $state<JamActivity[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let hasMore = $state(false);
	let skip = $state(0);

	async function loadActivities(reset = false) {
		try {
			loading = true;
			error = null;

			if (reset) {
				skip = 0;
				activities = [];
			}

			let url: string;
			if (jamId) {
				url = `${API_URL}/api/jams/${jamId}/activity?limit=${limit}&skip=${skip}`;
			} else {
				url = `${API_URL}/api/activity/feed?limit=${limit}&skip=${skip}`;
			}

			const response = await fetch(url, {
				credentials: 'include'
			});

			if (!response.ok) {
				throw new Error('Failed to load activity');
			}

			const data = await response.json();

			if (reset) {
				activities = data.activities;
			} else {
				activities = [...activities, ...data.activities];
			}

			hasMore = data.pagination.hasMore;
			skip += data.activities.length;
		} catch (err) {
			console.error('Error loading activity:', err);
			error = err instanceof Error ? err.message : 'Failed to load activity';
		} finally {
			loading = false;
		}
	}

	function loadMore() {
		if (!loading && hasMore) {
			loadActivities();
		}
	}

	function getActivityIcon(actionType: JamActivity['actionType']): string {
		switch (actionType) {
			case 'jam_created':
				return '🎵';
			case 'clip_added':
				return '➕';
			case 'clip_removed':
				return '➖';
			case 'mix_updated':
				return '🎛️';
			case 'collaborator_added':
			case 'invite_accepted':
			case 'request_approved':
				return '👥';
			case 'collaborator_removed':
				return '👋';
			case 'role_changed':
				return '🔄';
			case 'invite_sent':
				return '✉️';
			case 'request_sent':
				return '📨';
			case 'comment_added':
				return '💬';
			case 'jam_updated':
				return '✏️';
			case 'jam_published':
				return '🚀';
			default:
				return '📝';
		}
	}

	function getJamTitle(jam: JamActivity['jam']): string {
		return typeof jam === 'string' ? 'Jam' : jam.title;
	}

	$effect(() => {
		loadActivities(true);
	});
</script>

<div class="activity-feed">
	<div class="activity-header">
		<h3 class="activity-title">
			{jamId ? 'Jam Activity' : 'Recent Activity'}
		</h3>
		<button
			class="refresh-button"
			onclick={() => loadActivities(true)}
			disabled={loading}
			title="Refresh activity"
		>
			<span class:spin={loading}>↻</span>
		</button>
	</div>

	{#if error}
		<div class="error-message">
			<p>{error}</p>
			<button onclick={() => loadActivities(true)}>Try Again</button>
		</div>
	{:else if activities.length === 0 && !loading}
		<div class="empty-state">
			<p>No activity yet</p>
		</div>
	{:else}
		<div class="activity-list">
			{#each activities as activity (activity._id)}
				<div class="activity-item">
					<div class="activity-icon">
						{getActivityIcon(activity.actionType)}
					</div>
					<div class="activity-content">
						<div class="activity-user">
							{#if activity.user.image}
								<img
									src={activity.user.image}
									alt={activity.user.userName}
									class="user-avatar"
								/>
							{:else}
								<div class="user-avatar-placeholder">
									{activity.user.userName.charAt(0).toUpperCase()}
								</div>
							{/if}
							<span class="user-name">{activity.user.userName}</span>
						</div>
						<p class="activity-description">{activity.description}</p>
						{#if showJamInfo && activity.jam}
							<a
								href="/jam/{typeof activity.jam === 'string' ? activity.jam : activity.jam._id}"
								class="jam-link"
							>
								{getJamTitle(activity.jam)}
							</a>
						{/if}
						<time class="activity-time">
							{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
						</time>
					</div>
				</div>
			{/each}
		</div>

		{#if hasMore}
			<div class="load-more">
				<button onclick={loadMore} disabled={loading} class="load-more-button">
					{loading ? 'Loading...' : 'Load More'}
				</button>
			</div>
		{/if}
	{/if}

	{#if loading && activities.length === 0}
		<div class="loading-container">
			<LoadingSpinner />
		</div>
	{/if}
</div>

<style>
	.activity-feed {
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		padding: 1.5rem;
	}

	:global(.dark) .activity-feed {
		background: #1f2937;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.activity-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.activity-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
	}

	:global(.dark) .activity-title {
		color: #f9fafb;
	}

	.refresh-button {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0.25rem;
		color: #6b7280;
		transition: color 0.2s;
	}

	.refresh-button:hover:not(:disabled) {
		color: #111827;
	}

	:global(.dark) .refresh-button:hover:not(:disabled) {
		color: #f9fafb;
	}

	.refresh-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.spin {
		display: inline-block;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.activity-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.activity-item {
		display: flex;
		gap: 1rem;
		padding: 1rem;
		background: #f9fafb;
		border-radius: 8px;
		transition: background-color 0.2s;
	}

	:global(.dark) .activity-item {
		background: #374151;
	}

	.activity-item:hover {
		background: #f3f4f6;
	}

	:global(.dark) .activity-item:hover {
		background: #4b5563;
	}

	.activity-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.activity-content {
		flex: 1;
		min-width: 0;
	}

	.activity-user {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.user-avatar {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		object-fit: cover;
	}

	.user-avatar-placeholder {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: #9ca3af;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.user-name {
		font-weight: 600;
		color: #111827;
		font-size: 0.875rem;
	}

	:global(.dark) .user-name {
		color: #f9fafb;
	}

	.activity-description {
		color: #4b5563;
		font-size: 0.875rem;
		margin: 0 0 0.25rem 0;
	}

	:global(.dark) .activity-description {
		color: #d1d5db;
	}

	.jam-link {
		display: inline-block;
		color: #2563eb;
		text-decoration: none;
		font-size: 0.875rem;
		margin-bottom: 0.25rem;
	}

	.jam-link:hover {
		text-decoration: underline;
	}

	:global(.dark) .jam-link {
		color: #60a5fa;
	}

	.activity-time {
		display: block;
		color: #9ca3af;
		font-size: 0.75rem;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: #9ca3af;
	}

	.error-message {
		text-align: center;
		padding: 2rem 1rem;
	}

	.error-message p {
		color: #ef4444;
		margin-bottom: 1rem;
	}

	.error-message button {
		background: #ef4444;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
	}

	.error-message button:hover {
		background: #dc2626;
	}

	.load-more {
		margin-top: 1.5rem;
		text-align: center;
	}

	.load-more-button {
		background: white;
		border: 1px solid #d1d5db;
		color: #374151;
		padding: 0.5rem 1.5rem;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s;
	}

	:global(.dark) .load-more-button {
		background: #1f2937;
		border-color: #4b5563;
		color: #f9fafb;
	}

	.load-more-button:hover:not(:disabled) {
		background: #f9fafb;
		border-color: #9ca3af;
	}

	:global(.dark) .load-more-button:hover:not(:disabled) {
		background: #374151;
		border-color: #6b7280;
	}

	.load-more-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.loading-container {
		display: flex;
		justify-content: center;
		padding: 3rem 0;
	}
</style>
