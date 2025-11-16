<script lang="ts">
	import type { Collaborator, CollaboratorRole, User } from '$lib/api/types';
	import { toast } from '$lib/stores/toast';
	import LoadingSpinner from '../LoadingSpinner.svelte';

	interface Props {
		jamId: string;
		collaborators: Collaborator[];
		isOwner: boolean;
		canEdit: boolean;
	}

	let { jamId, collaborators = [], isOwner = false, canEdit: _canEdit = false }: Props = $props();

	const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

	let showInviteModal = $state(false);
	let searchQuery = $state('');
	let searchResults = $state<User[]>([]);
	let searching = $state(false);
	let selectedRole = $state<CollaboratorRole>('contributor');
	let inviteMessage = $state('');
	let processing = $state(false);

	async function searchUsers() {
		if (searchQuery.trim().length < 2) {
			searchResults = [];
			return;
		}

		try {
			searching = true;
			const response = await fetch(
				`${API_URL}/api/users/search?q=${encodeURIComponent(searchQuery)}`,
				{ credentials: 'include' }
			);

			if (response.ok) {
				const data = await response.json();
				searchResults = data.users || [];
			}
		} catch (err) {
			console.error('Error searching users:', err);
		} finally {
			searching = false;
		}
	}

	async function sendInvite(userId: string) {
		try {
			processing = true;
			const response = await fetch(`${API_URL}/api/jams/${jamId}/invite`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					userId,
					role: selectedRole,
					message: inviteMessage.trim()
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Failed to send invite');
			}

			const data = await response.json();
			toast.show(data.message || 'Invite sent successfully', 'success');

			// Reset form
			showInviteModal = false;
			searchQuery = '';
			searchResults = [];
			inviteMessage = '';
			selectedRole = 'contributor';
		} catch (err) {
			toast.show(err instanceof Error ? err.message : 'Failed to send invite', 'error');
		} finally {
			processing = false;
		}
	}

	function getRoleBadgeClass(role: CollaboratorRole): string {
		switch (role) {
			case 'producer':
				return 'role-producer';
			case 'contributor':
				return 'role-contributor';
			case 'viewer':
				return 'role-viewer';
		}
	}

	function getRoleDescription(role: CollaboratorRole): string {
		switch (role) {
			case 'producer':
				return 'Can edit jam settings and manage clips';
			case 'contributor':
				return 'Can add clips to the jam';
			case 'viewer':
				return 'Can view and comment only';
		}
	}

	let debounceTimer: ReturnType<typeof setTimeout>;
	$effect(() => {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			if (searchQuery) {
				searchUsers();
			}
		}, 300);
	});
</script>

<div class="collaborators-manager">
	<div class="collaborators-header">
		<h3 class="collaborators-title">Collaborators ({collaborators.length})</h3>
		{#if isOwner}
			<button class="invite-button" onclick={() => (showInviteModal = true)}>
				Invite Collaborator
			</button>
		{/if}
	</div>

	<div class="collaborators-list">
		{#each collaborators as collab (collab.user._id)}
			<div class="collaborator-item">
				<div class="collaborator-info">
					{#if collab.user.image}
						<img src={collab.user.image} alt={collab.user.userName} class="collaborator-avatar" />
					{:else}
						<div class="collaborator-avatar-placeholder">
							{collab.user.userName.charAt(0).toUpperCase()}
						</div>
					{/if}
					<div class="collaborator-details">
						<span class="collaborator-name">{collab.user.userName}</span>
						<span class="role-badge {getRoleBadgeClass(collab.role)}">
							{collab.role}
						</span>
					</div>
				</div>
			</div>
		{/each}
	</div>

	{#if showInviteModal}
		<div
			class="modal-backdrop"
			onclick={() => (showInviteModal = false)}
			onkeydown={(e) => e.key === 'Enter' && (showInviteModal = false)}
			role="button"
			tabindex="0"
		></div>
		<div class="modal">
			<div class="modal-header">
				<h4>Invite Collaborator</h4>
				<button class="close-button" onclick={() => (showInviteModal = false)}>×</button>
			</div>

			<div class="modal-content">
				<div class="form-group">
					<label for="search-users">Search Users</label>
					<input
						id="search-users"
						type="text"
						bind:value={searchQuery}
						placeholder="Search by username..."
						class="search-input"
					/>
				</div>

				{#if searching}
					<div class="search-loading">
						<LoadingSpinner />
					</div>
				{:else if searchResults.length > 0}
					<div class="search-results">
						{#each searchResults as user (user._id)}
							<div class="search-result-item">
								<div class="user-info">
									{#if user.image}
										<img src={user.image} alt={user.userName} class="user-avatar" />
									{:else}
										<div class="user-avatar-placeholder">
											{user.userName.charAt(0).toUpperCase()}
										</div>
									{/if}
									<span class="user-name">{user.userName}</span>
								</div>
								<button
									class="select-button"
									onclick={() => sendInvite(user._id)}
									disabled={processing}
								>
									Invite
								</button>
							</div>
						{/each}
					</div>
				{:else if searchQuery.trim().length >= 2}
					<p class="no-results">No users found</p>
				{/if}

				<div class="form-group">
					<label for="role-select">Role</label>
					<select id="role-select" bind:value={selectedRole} class="role-select">
						<option value="producer">Producer - {getRoleDescription('producer')}</option>
						<option value="contributor">Contributor - {getRoleDescription('contributor')}</option>
						<option value="viewer">Viewer - {getRoleDescription('viewer')}</option>
					</select>
				</div>

				<div class="form-group">
					<label for="invite-message">Message (optional)</label>
					<textarea
						id="invite-message"
						bind:value={inviteMessage}
						placeholder="Add a personal message..."
						rows="3"
						class="message-textarea"
					></textarea>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.collaborators-manager {
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		padding: 1.5rem;
	}

	:global(.dark) .collaborators-manager {
		background: #1f2937;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.collaborators-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.collaborators-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
	}

	:global(.dark) .collaborators-title {
		color: #f9fafb;
	}

	.invite-button {
		background: #2563eb;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 500;
		transition: background 0.2s;
	}

	.invite-button:hover {
		background: #1d4ed8;
	}

	.collaborators-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.collaborator-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: #f9fafb;
		border-radius: 6px;
	}

	:global(.dark) .collaborator-item {
		background: #374151;
	}

	.collaborator-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.collaborator-avatar,
	.user-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		object-fit: cover;
	}

	.collaborator-avatar-placeholder,
	.user-avatar-placeholder {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: #9ca3af;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
	}

	.collaborator-details {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.collaborator-name,
	.user-name {
		font-weight: 500;
		color: #111827;
	}

	:global(.dark) .collaborator-name,
	:global(.dark) .user-name {
		color: #f9fafb;
	}

	.role-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		display: inline-block;
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

	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 998;
	}

	.modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: white;
		border-radius: 8px;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
		max-width: 500px;
		width: 90%;
		max-height: 90vh;
		overflow-y: auto;
		z-index: 999;
	}

	:global(.dark) .modal {
		background: #1f2937;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	:global(.dark) .modal-header {
		border-color: #374151;
	}

	.modal-header h4 {
		margin: 0;
		font-size: 1.25rem;
		color: #111827;
	}

	:global(.dark) .modal-header h4 {
		color: #f9fafb;
	}

	.close-button {
		background: none;
		border: none;
		font-size: 2rem;
		color: #6b7280;
		cursor: pointer;
		padding: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-button:hover {
		color: #111827;
	}

	:global(.dark) .close-button:hover {
		color: #f9fafb;
	}

	.modal-content {
		padding: 1.5rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: #374151;
	}

	:global(.dark) .form-group label {
		color: #d1d5db;
	}

	.search-input,
	.role-select,
	.message-textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 1rem;
	}

	:global(.dark) .search-input,
	:global(.dark) .role-select,
	:global(.dark) .message-textarea {
		background: #374151;
		border-color: #4b5563;
		color: #f9fafb;
	}

	.search-loading {
		display: flex;
		justify-content: center;
		padding: 2rem;
	}

	.search-results {
		max-height: 200px;
		overflow-y: auto;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		margin-bottom: 1rem;
	}

	:global(.dark) .search-results {
		border-color: #4b5563;
	}

	.search-result-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		border-bottom: 1px solid #e5e7eb;
	}

	:global(.dark) .search-result-item {
		border-color: #4b5563;
	}

	.search-result-item:last-child {
		border-bottom: none;
	}

	.search-result-item:hover {
		background: #f9fafb;
	}

	:global(.dark) .search-result-item:hover {
		background: #374151;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.select-button {
		background: #10b981;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 500;
		transition: background 0.2s;
	}

	.select-button:hover:not(:disabled) {
		background: #059669;
	}

	.select-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.no-results {
		text-align: center;
		color: #9ca3af;
		padding: 2rem;
	}
</style>
