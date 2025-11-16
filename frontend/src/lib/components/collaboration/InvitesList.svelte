<script lang="ts">
	import type { JamInvite } from '$lib/api/types';
	import { formatDistanceToNow } from 'date-fns';
	import LoadingSpinner from '../LoadingSpinner.svelte';
	import { showToast } from '$lib/stores/toast';

	const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

	let invites = $state<JamInvite[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let processingInvite = $state<string | null>(null);

	async function loadInvites() {
		try {
			loading = true;
			error = null;

			const response = await fetch(`${API_URL}/api/invites`, {
				credentials: 'include'
			});

			if (!response.ok) {
				throw new Error('Failed to load invites');
			}

			const data = await response.json();
			invites = data.invites;
		} catch (err) {
			console.error('Error loading invites:', err);
			error = err instanceof Error ? err.message : 'Failed to load invites';
		} finally {
			loading = false;
		}
	}

	async function handleInvite(inviteId: string, action: 'accept' | 'decline') {
		try {
			processingInvite = inviteId;

			const response = await fetch(`${API_URL}/api/invites/${inviteId}/${action}`, {
				method: 'POST',
				credentials: 'include'
			});

			if (!response.ok) {
				throw new Error(`Failed to ${action} invite`);
			}

			const data = await response.json();
			showToast(data.message || `Invite ${action}ed successfully`, 'success');

			// Remove the invite from the list
			invites = invites.filter((inv) => inv._id !== inviteId);

			// If accepted, optionally redirect to jam
			if (action === 'accept' && data.jam) {
				setTimeout(() => {
					window.location.href = `/jam/${data.jam._id}`;
				}, 1500);
			}
		} catch (err) {
			console.error(`Error ${action}ing invite:`, err);
			showToast(
				err instanceof Error ? err.message : `Failed to ${action} invite`,
				'error'
			);
		} finally {
			processingInvite = null;
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
		loadInvites();
	});
</script>

<div class="invites-list">
	<div class="invites-header">
		<h3 class="invites-title">Collaboration Invites</h3>
		<button
			class="refresh-button"
			onclick={() => loadInvites()}
			disabled={loading}
			title="Refresh invites"
		>
			<span class:spin={loading}>↻</span>
		</button>
	</div>

	{#if error}
		<div class="error-message">
			<p>{error}</p>
			<button onclick={() => loadInvites()}>Try Again</button>
		</div>
	{:else if invites.length === 0 && !loading}
		<div class="empty-state">
			<p>No pending invites</p>
		</div>
	{:else}
		<div class="invites-grid">
			{#each invites as invite (invite._id)}
				<div class="invite-card">
					{#if invite.jam.image}
						<img src={invite.jam.image} alt={invite.jam.title} class="jam-image" />
					{:else}
						<div class="jam-image-placeholder">
							{invite.jam.title.charAt(0).toUpperCase()}
						</div>
					{/if}

					<div class="invite-content">
						<h4 class="jam-title">{invite.jam.title}</h4>
						<p class="invite-from">
							from <strong>{invite.invitedBy.userName}</strong>
						</p>

						<div class="invite-details">
							<span class="role-badge {getRoleBadgeClass(invite.role)}">
								{invite.role}
							</span>
							<span class="genre-badge">{invite.jam.genre}</span>
						</div>

						{#if invite.message}
							<p class="invite-message">"{invite.message}"</p>
						{/if}

						<div class="invite-meta">
							<time class="invite-time">
								{formatDistanceToNow(new Date(invite.createdAt), { addSuffix: true })}
							</time>
							<span class="invite-expires">
								Expires {formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: true })}
							</span>
						</div>

						<div class="invite-actions">
							<button
								class="accept-button"
								onclick={() => handleInvite(invite._id, 'accept')}
								disabled={processingInvite !== null}
							>
								{processingInvite === invite._id ? 'Processing...' : 'Accept'}
							</button>
							<button
								class="decline-button"
								onclick={() => handleInvite(invite._id, 'decline')}
								disabled={processingInvite !== null}
							>
								Decline
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if loading && invites.length === 0}
		<div class="loading-container">
			<LoadingSpinner />
		</div>
	{/if}
</div>

<style>
	.invites-list {
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		padding: 1.5rem;
	}

	:global(.dark) .invites-list {
		background: #1f2937;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.invites-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.invites-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
	}

	:global(.dark) .invites-title {
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

	.invites-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.invite-card {
		background: #f9fafb;
		border-radius: 8px;
		overflow: hidden;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	:global(.dark) .invite-card {
		background: #374151;
	}

	.invite-card:hover {
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

	.invite-content {
		padding: 1rem;
	}

	.jam-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 0.5rem 0;
	}

	:global(.dark) .jam-title {
		color: #f9fafb;
	}

	.invite-from {
		color: #6b7280;
		font-size: 0.875rem;
		margin: 0 0 0.75rem 0;
	}

	:global(.dark) .invite-from {
		color: #9ca3af;
	}

	.invite-from strong {
		color: #111827;
	}

	:global(.dark) .invite-from strong {
		color: #f9fafb;
	}

	.invite-details {
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

	.invite-message {
		color: #4b5563;
		font-size: 0.875rem;
		font-style: italic;
		margin: 0.75rem 0;
		padding: 0.5rem;
		background: white;
		border-radius: 4px;
	}

	:global(.dark) .invite-message {
		color: #d1d5db;
		background: #1f2937;
	}

	.invite-meta {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin: 0.75rem 0;
	}

	.invite-time,
	.invite-expires {
		color: #9ca3af;
		font-size: 0.75rem;
	}

	.invite-expires {
		color: #ef4444;
	}

	.invite-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.accept-button,
	.decline-button {
		flex: 1;
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.accept-button {
		background: #10b981;
		color: white;
	}

	.accept-button:hover:not(:disabled) {
		background: #059669;
	}

	.decline-button {
		background: white;
		color: #6b7280;
		border: 1px solid #d1d5db;
	}

	:global(.dark) .decline-button {
		background: #1f2937;
		border-color: #4b5563;
		color: #9ca3af;
	}

	.decline-button:hover:not(:disabled) {
		background: #f3f4f6;
		border-color: #9ca3af;
	}

	:global(.dark) .decline-button:hover:not(:disabled) {
		background: #374151;
		border-color: #6b7280;
	}

	.accept-button:disabled,
	.decline-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
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
