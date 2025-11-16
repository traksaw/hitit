<script lang="ts">
	import type { JamVersion } from '$lib/api/types';
	import { formatDistanceToNow } from 'date-fns';
	import LoadingSpinner from '../LoadingSpinner.svelte';
	import { toast } from '$lib/stores/toast';

	interface Props {
		jamId: string;
		canEdit: boolean;
	}

	let { jamId, canEdit = false }: Props = $props();

	const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

	let versions = $state<JamVersion[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let processing = $state(false);

	let showSaveModal = $state(false);
	let versionName = $state('');
	let versionDescription = $state('');
	let versionTags = $state('');
	let isPinned = $state(false);

	async function loadVersions() {
		try {
			loading = true;
			error = null;

			const response = await fetch(`${API_URL}/api/jams/${jamId}/versions`, {
				credentials: 'include'
			});

			if (!response.ok) {
				throw new Error('Failed to load versions');
			}

			const data = await response.json();
			versions = data.versions;
		} catch (err) {
			console.error('Error loading versions:', err);
			error = err instanceof Error ? err.message : 'Failed to load versions';
		} finally {
			loading = false;
		}
	}

	async function saveVersion() {
		try {
			processing = true;
			const response = await fetch(`${API_URL}/api/jams/${jamId}/versions`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					versionName: versionName.trim() || `Version ${versions.length + 1}`,
					description: versionDescription.trim(),
					tags: versionTags.split(',').map((t) => t.trim()).filter(Boolean),
					isPinned
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to save version');
			}

			const data = await response.json();
			toast.show(data.message || 'Version saved successfully', 'success');

			// Reload versions
			await loadVersions();

			// Reset form
			showSaveModal = false;
			versionName = '';
			versionDescription = '';
			versionTags = '';
			isPinned = false;
		} catch (err) {
			toast.show(err instanceof Error ? err.message : 'Failed to save version', 'error');
		} finally {
			processing = false;
		}
	}

	async function restoreVersion(versionNumber: number, createBackup = true) {
		if (!confirm(`Are you sure you want to restore to version ${versionNumber}?`)) {
			return;
		}

		try {
			processing = true;
			const response = await fetch(
				`${API_URL}/api/jams/${jamId}/versions/${versionNumber}/restore`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({ createBackup })
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to restore version');
			}

			const data = await response.json();
			toast.show(data.message || 'Version restored successfully', 'success');

			// Reload page to show restored state
			setTimeout(() => {
				window.location.reload();
			}, 1500);
		} catch (err) {
			toast.show(err instanceof Error ? err.message : 'Failed to restore version', 'error');
		} finally {
			processing = false;
		}
	}

	async function deleteVersion(versionId: string, versionNumber: number) {
		if (!confirm(`Are you sure you want to delete version ${versionNumber}?`)) {
			return;
		}

		try {
			processing = true;
			const response = await fetch(`${API_URL}/api/jams/${jamId}/versions/${versionNumber}`, {
				method: 'DELETE',
				credentials: 'include'
			});

			if (!response.ok) {
				throw new Error('Failed to delete version');
			}

			toast.show('Version deleted successfully', 'success');

			// Remove from list
			versions = versions.filter((v) => v._id !== versionId);
		} catch (err) {
			toast.show(err instanceof Error ? err.message : 'Failed to delete version', 'error');
		} finally {
			processing = false;
		}
	}

	$effect(() => {
		loadVersions();
	});
</script>

<div class="jam-versions">
	<div class="versions-header">
		<h3 class="versions-title">Version History</h3>
		<div class="header-actions">
			<button
				class="refresh-button"
				onclick={() => loadVersions()}
				disabled={loading}
				title="Refresh versions"
			>
				<span class:spin={loading}>↻</span>
			</button>
			{#if canEdit}
				<button class="save-button" onclick={() => (showSaveModal = true)} disabled={processing}>
					Save Version
				</button>
			{/if}
		</div>
	</div>

	{#if error}
		<div class="error-message">
			<p>{error}</p>
			<button onclick={() => loadVersions()}>Try Again</button>
		</div>
	{:else if versions.length === 0 && !loading}
		<div class="empty-state">
			<p>No versions saved yet</p>
			{#if canEdit}
				<p class="empty-hint">Save your first version to track changes</p>
			{/if}
		</div>
	{:else}
		<div class="versions-timeline">
			{#each versions as version (version._id)}
				<div class="version-item" class:pinned={version.isPinned}>
					<div class="version-marker"></div>
					<div class="version-content">
						<div class="version-header-row">
							<div class="version-info">
								<h4 class="version-name">
									{version.versionName}
									{#if version.isPinned}
										<span class="pin-badge" title="Pinned version">📌</span>
									{/if}
								</h4>
								<span class="version-number">v{version.versionNumber}</span>
							</div>
							<div class="version-actions">
								{#if canEdit}
									<button
										class="restore-button"
										onclick={() => restoreVersion(version.versionNumber)}
										disabled={processing}
										title="Restore this version"
									>
										Restore
									</button>
									<button
										class="delete-button"
										onclick={() => deleteVersion(version._id, version.versionNumber)}
										disabled={processing}
										title="Delete this version"
									>
										Delete
									</button>
								{/if}
							</div>
						</div>

						{#if version.description}
							<p class="version-description">{version.description}</p>
						{/if}

						<div class="version-stats">
							<span class="stat">{version.snapshot.clipCount} clips</span>
							<span class="stat">{version.snapshot.collaboratorCount} collaborators</span>
						</div>

						{#if version.tags.length > 0}
							<div class="version-tags">
								{#each version.tags as tag (tag)}
									<span class="tag">{tag}</span>
								{/each}
							</div>
						{/if}

						<div class="version-meta">
							<span class="version-author">
								Saved by {version.createdBy.userName}
							</span>
							<time class="version-time">
								{formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
							</time>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if loading && versions.length === 0}
		<div class="loading-container">
			<LoadingSpinner />
		</div>
	{/if}

	{#if showSaveModal}
		<div
			class="modal-backdrop"
			onclick={() => (showSaveModal = false)}
			onkeydown={(e) => e.key === 'Enter' && (showSaveModal = false)}
			role="button"
			tabindex="0"
		></div>
		<div class="modal">
			<div class="modal-header">
				<h4>Save New Version</h4>
				<button class="close-button" onclick={() => (showSaveModal = false)}>×</button>
			</div>

			<div class="modal-content">
				<div class="form-group">
					<label for="version-name">Version Name</label>
					<input
						id="version-name"
						type="text"
						bind:value={versionName}
						placeholder="e.g., Final Mix, Demo, v2.0"
						class="text-input"
					/>
				</div>

				<div class="form-group">
					<label for="version-description">Description (optional)</label>
					<textarea
						id="version-description"
						bind:value={versionDescription}
						placeholder="What changed in this version?"
						rows="3"
						class="textarea-input"
					></textarea>
				</div>

				<div class="form-group">
					<label for="version-tags">Tags (comma-separated, optional)</label>
					<input
						id="version-tags"
						type="text"
						bind:value={versionTags}
						placeholder="e.g., final, demo, backup"
						class="text-input"
					/>
				</div>

				<div class="form-group checkbox-group">
					<label>
						<input type="checkbox" bind:checked={isPinned} />
						Pin this version as important
					</label>
				</div>

				<div class="modal-actions">
					<button class="cancel-button" onclick={() => (showSaveModal = false)}>Cancel</button>
					<button class="submit-button" onclick={saveVersion} disabled={processing}>
						{processing ? 'Saving...' : 'Save Version'}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.jam-versions {
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		padding: 1.5rem;
	}

	:global(.dark) .jam-versions {
		background: #1f2937;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.versions-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.versions-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
	}

	:global(.dark) .versions-title {
		color: #f9fafb;
	}

	.header-actions {
		display: flex;
		gap: 0.5rem;
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

	.save-button {
		background: #2563eb;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 500;
		transition: background 0.2s;
	}

	.save-button:hover:not(:disabled) {
		background: #1d4ed8;
	}

	.save-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.versions-timeline {
		position: relative;
		padding-left: 2rem;
	}

	.versions-timeline::before {
		content: '';
		position: absolute;
		left: 0.5rem;
		top: 0;
		bottom: 0;
		width: 2px;
		background: #e5e7eb;
	}

	:global(.dark) .versions-timeline::before {
		background: #4b5563;
	}

	.version-item {
		position: relative;
		margin-bottom: 1.5rem;
		padding-left: 1.5rem;
	}

	.version-item.pinned .version-content {
		border-left: 3px solid #f59e0b;
	}

	.version-marker {
		position: absolute;
		left: 0;
		top: 0.25rem;
		width: 1rem;
		height: 1rem;
		background: #2563eb;
		border: 3px solid white;
		border-radius: 50%;
		z-index: 1;
	}

	:global(.dark) .version-marker {
		border-color: #1f2937;
	}

	.version-item.pinned .version-marker {
		background: #f59e0b;
	}

	.version-content {
		background: #f9fafb;
		border-radius: 8px;
		padding: 1rem;
		border-left: 3px solid transparent;
	}

	:global(.dark) .version-content {
		background: #374151;
	}

	.version-header-row {
		display: flex;
		justify-content: space-between;
		align-items: start;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}

	.version-info {
		flex: 1;
	}

	.version-name {
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 0.25rem 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	:global(.dark) .version-name {
		color: #f9fafb;
	}

	.pin-badge {
		font-size: 1rem;
	}

	.version-number {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		background: #e0e7ff;
		color: #3730a3;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	:global(.dark) .version-number {
		background: #3730a3;
		color: #e0e7ff;
	}

	.version-actions {
		display: flex;
		gap: 0.5rem;
	}

	.restore-button,
	.delete-button {
		padding: 0.25rem 0.75rem;
		border: none;
		border-radius: 4px;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.restore-button {
		background: #10b981;
		color: white;
	}

	.restore-button:hover:not(:disabled) {
		background: #059669;
	}

	.delete-button {
		background: #ef4444;
		color: white;
	}

	.delete-button:hover:not(:disabled) {
		background: #dc2626;
	}

	.restore-button:disabled,
	.delete-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.version-description {
		color: #4b5563;
		font-size: 0.875rem;
		margin: 0 0 0.75rem 0;
	}

	:global(.dark) .version-description {
		color: #d1d5db;
	}

	.version-stats {
		display: flex;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}

	.stat {
		color: #6b7280;
		font-size: 0.875rem;
	}

	:global(.dark) .stat {
		color: #9ca3af;
	}

	.version-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.tag {
		padding: 0.25rem 0.5rem;
		background: #fce7f3;
		color: #9f1239;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	:global(.dark) .tag {
		background: #9f1239;
		color: #fce7f3;
	}

	.version-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.75rem;
		color: #9ca3af;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
	}

	.empty-state p {
		color: #9ca3af;
		margin: 0;
	}

	.empty-hint {
		font-size: 0.875rem;
		margin-top: 0.5rem;
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

	.text-input,
	.textarea-input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 1rem;
	}

	:global(.dark) .text-input,
	:global(.dark) .textarea-input {
		background: #374151;
		border-color: #4b5563;
		color: #f9fafb;
	}

	.checkbox-group label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}

	.cancel-button,
	.submit-button {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.cancel-button {
		background: white;
		color: #374151;
		border: 1px solid #d1d5db;
	}

	:global(.dark) .cancel-button {
		background: #374151;
		border-color: #4b5563;
		color: #f9fafb;
	}

	.cancel-button:hover {
		background: #f9fafb;
	}

	:global(.dark) .cancel-button:hover {
		background: #4b5563;
	}

	.submit-button {
		background: #2563eb;
		color: white;
	}

	.submit-button:hover:not(:disabled) {
		background: #1d4ed8;
	}

	.submit-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
