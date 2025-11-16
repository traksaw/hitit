<script lang="ts">
	import type { JamRequest } from '$lib/api/types';
	import { formatDistanceToNow } from 'date-fns';
	import LoadingSpinner from '../LoadingSpinner.svelte';
	// import { showToast } from '$lib/stores/toast';

	const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

	let requests = $state<JamRequest[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadRequests() {
		try {
			loading = true;
			error = null;

			const response = await fetch(`${API_URL}/api/my-requests`, {
				credentials: 'include'
			});

			if (!response.ok) {
				throw new Error('Failed to load requests');
			}

			const data = await response.json();
			requests = data.requests;
		} catch (err) {
			console.error('Error loading requests:', err);
			error = err instanceof Error ? err.message : 'Failed to load requests';
		} finally {
			loading = false;
		}
	}

	function getStatusBadgeClass(status: string): string {
		switch (status) {
			case 'pending':
				return 'status-pending';
			case 'approved':
				return 'status-approved';
			case 'denied':
				return 'status-denied';
			default:
				return '';
		}
	}

	function getRoleBadgeClass(role: string): string {
		switch (role) {
			case 'producer':
				return 'role-producer';
			case 'contributor':
				return 'role-contributor';
			case 'viewer':
				return 'role-viewer';
			default:
				return '';
		}
	}

	$effect(() => {
		loadRequests();
	});
</script>

<div class="requests-list">
	<div class="requests-header">
		<h3 class="requests-title">My Collaboration Requests</h3>
		<button
			class="refresh-button"
			onclick={() => loadRequests()}
			disabled={loading}
			title="Refresh requests"
		>
			<span class:spin={loading}>↻</span>
		</button>
	</div>

	{#if error}
		<div class="error-message">
			<p>{error}</p>
			<button onclick={() => loadRequests()}>Try Again</button>
		</div>
	{:else if requests.length === 0 && !loading}
		<div class="empty-state">
			<p>No collaboration requests</p>
		</div>
	{:else}
		<div class="requests-grid">
			{#each requests as request (request._id)}
				<div class="request-card">
					{#if request.jam.image}
						<img src={request.jam.image} alt={request.jam.title} class="jam-image" />
					{:else}
						<div class="jam-image-placeholder">
							{request.jam.title.charAt(0).toUpperCase()}
						</div>
					{/if}

					<div class="request-content">
						<div class="request-header-row">
							<h4 class="jam-title">{request.jam.title}</h4>
							<span class="status-badge {getStatusBadgeClass(request.status)}">
								{request.status}
							</span>
						</div>

						<div class="request-details">
							<span class="role-badge {getRoleBadgeClass(request.requestedRole)}">
								{request.requestedRole}
							</span>
							<span class="genre-badge">{request.jam.genre}</span>
						</div>

						{#if request.message}
							<p class="request-message">"{request.message}"</p>
						{/if}

						{#if request.skills && request.skills.length > 0}
							<div class="skills-list">
								<span class="skills-label">Skills:</span>
								{#each request.skills as skill (skill)}
									<span class="skill-tag">{skill}</span>
								{/each}
							</div>
						{/if}

						{#if request.portfolio}
							<a
								href={request.portfolio}
								target="_blank"
								rel="noopener noreferrer"
								class="portfolio-link"
							>
								View Portfolio ↗
							</a>
						{/if}

						<div class="request-meta">
							<time class="request-time">
								Sent {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
							</time>
							{#if request.respondedAt}
								<time class="response-time">
									Responded {formatDistanceToNow(new Date(request.respondedAt), {
										addSuffix: true
									})}
								</time>
							{/if}
						</div>

						{#if request.status === 'approved'}
							<a href="/jam/{request.jam._id}" class="view-jam-button"> View Jam </a>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if loading && requests.length === 0}
		<div class="loading-container">
			<LoadingSpinner />
		</div>
	{/if}
</div>

<style>
	.requests-list {
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		padding: 1.5rem;
	}

	:global(.dark) .requests-list {
		background: #1f2937;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.requests-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.requests-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
	}

	:global(.dark) .requests-title {
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

	.requests-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.request-card {
		background: #f9fafb;
		border-radius: 8px;
		overflow: hidden;
		transition:
			transform 0.2s,
			box-shadow 0.2s;
	}

	:global(.dark) .request-card {
		background: #374151;
	}

	.request-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.jam-image {
		width: 100%;
		height: 150px;
		object-fit: cover;
	}

	.jam-image-placeholder {
		width: 100%;
		height: 150px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 3rem;
		font-weight: 700;
		color: white;
	}

	.request-content {
		padding: 1rem;
	}

	.request-header-row {
		display: flex;
		justify-content: space-between;
		align-items: start;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.jam-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
		flex: 1;
	}

	:global(.dark) .jam-title {
		color: #f9fafb;
	}

	.status-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		flex-shrink: 0;
	}

	.status-pending {
		background: #fef3c7;
		color: #92400e;
	}

	:global(.dark) .status-pending {
		background: #92400e;
		color: #fef3c7;
	}

	.status-approved {
		background: #d1fae5;
		color: #065f46;
	}

	:global(.dark) .status-approved {
		background: #065f46;
		color: #d1fae5;
	}

	.status-denied {
		background: #fee2e2;
		color: #991b1b;
	}

	:global(.dark) .status-denied {
		background: #991b1b;
		color: #fee2e2;
	}

	.request-details {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.role-badge,
	.genre-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.role-producer {
		background: #dbeafe;
		color: #1e40af;
	}

	:global(.dark) .role-producer {
		background: #1e40af;
		color: #dbeafe;
	}

	.role-contributor {
		background: #d1fae5;
		color: #065f46;
	}

	:global(.dark) .role-contributor {
		background: #065f46;
		color: #d1fae5;
	}

	.role-viewer {
		background: #e5e7eb;
		color: #374151;
	}

	:global(.dark) .role-viewer {
		background: #4b5563;
		color: #e5e7eb;
	}

	.genre-badge {
		background: #fce7f3;
		color: #9f1239;
	}

	:global(.dark) .genre-badge {
		background: #9f1239;
		color: #fce7f3;
	}

	.request-message {
		color: #4b5563;
		font-size: 0.875rem;
		font-style: italic;
		margin: 0.75rem 0;
		padding: 0.5rem;
		background: white;
		border-radius: 4px;
	}

	:global(.dark) .request-message {
		color: #d1d5db;
		background: #1f2937;
	}

	.skills-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
		margin: 0.75rem 0;
	}

	.skills-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: #6b7280;
	}

	:global(.dark) .skills-label {
		color: #9ca3af;
	}

	.skill-tag {
		padding: 0.25rem 0.5rem;
		background: #e0e7ff;
		color: #3730a3;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	:global(.dark) .skill-tag {
		background: #3730a3;
		color: #e0e7ff;
	}

	.portfolio-link {
		display: inline-block;
		color: #2563eb;
		text-decoration: none;
		font-size: 0.875rem;
		margin: 0.5rem 0;
	}

	.portfolio-link:hover {
		text-decoration: underline;
	}

	:global(.dark) .portfolio-link {
		color: #60a5fa;
	}

	.request-meta {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin: 0.75rem 0;
	}

	.request-time,
	.response-time {
		color: #9ca3af;
		font-size: 0.75rem;
	}

	.view-jam-button {
		display: block;
		width: 100%;
		padding: 0.5rem 1rem;
		background: #10b981;
		color: white;
		text-align: center;
		text-decoration: none;
		border-radius: 6px;
		font-weight: 500;
		margin-top: 1rem;
		transition: background 0.2s;
	}

	.view-jam-button:hover {
		background: #059669;
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

	.loading-container {
		display: flex;
		justify-content: center;
		padding: 3rem 0;
	}
</style>
