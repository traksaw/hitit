<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';

	// Get API URL from environment variable
	const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

	interface Notification {
		_id: string;
		sender: { userName: string; image: string };
		type: 'like' | 'comment' | 'collaborator_add';
		message: string;
		jam?: { title: string; _id: string };
		read: boolean;
		createdAt: string;
	}

	let notifications: Notification[] = $state([]);
	let unreadCount: number = $state(0);
	let showDropdown: boolean = $state(false);
	let loading: boolean = $state(false);
	let dropdownElement: HTMLElement | null = null;

	async function loadNotifications() {
		loading = true;
		try {
			const response = await fetch(`${API_URL}/api/notifications`, {
				credentials: 'include' // Important: Send cookies
			});
			if (response.ok) {
				const data = await response.json();
				notifications = data.notifications || [];
				updateUnreadCount();
			}
		} catch (error) {
			console.error('Failed to load notifications:', error);
		} finally {
			loading = false;
		}
	}

	async function loadUnreadCount() {
		try {
			const response = await fetch(`${API_URL}/api/notifications/unread-count`, {
				credentials: 'include' // Important: Send cookies
			});
			if (response.ok) {
				const data = await response.json();
				unreadCount = data.count || 0;
			}
		} catch (error) {
			console.error('Failed to load unread count:', error);
		}
	}

	function updateUnreadCount() {
		unreadCount = notifications.filter((n) => !n.read).length;
	}

	async function toggleDropdown() {
		showDropdown = !showDropdown;
		if (showDropdown) {
			await loadNotifications();
		}
	}

	async function markAsRead(id: string) {
		try {
			await fetch(`${API_URL}/api/notifications/${id}/read`, {
				method: 'POST',
				credentials: 'include'
			});
			notifications = notifications.map((n) => (n._id === id ? { ...n, read: true } : n));
			updateUnreadCount();
		} catch (error) {
			console.error('Failed to mark as read:', error);
		}
	}

	async function markAllAsRead() {
		try {
			await fetch(`${API_URL}/api/notifications/mark-all-read`, {
				method: 'POST',
				credentials: 'include'
			});
			notifications = notifications.map((n) => ({ ...n, read: true }));
			updateUnreadCount();
		} catch (error) {
			console.error('Failed to mark all as read:', error);
		}
	}

	function handleNotificationClick(notification: Notification) {
		if (!notification.read) {
			markAsRead(notification._id);
		}
		showDropdown = false;
		if (notification.jam) {
			goto(`/jam/${notification.jam._id}`);
		}
	}

	function handleClickOutside(event: MouseEvent) {
		if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
			showDropdown = false;
		}
	}

	function formatTimeAgo(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

		if (seconds < 60) return 'just now';
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		if (days < 7) return `${days}d ago`;
		const weeks = Math.floor(days / 7);
		return `${weeks}w ago`;
	}

	onMount(() => {
		loadUnreadCount();
		// Refresh unread count every 30 seconds
		const interval = setInterval(loadUnreadCount, 30000);

		// Add click outside listener
		document.addEventListener('click', handleClickOutside);

		return () => {
			clearInterval(interval);
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<div class="notification-bell" bind:this={dropdownElement}>
	<button
		on:click={toggleDropdown}
		class="bell-button relative rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-white/20"
		title="Notifications"
		aria-label="Notifications"
	>
		<span class="text-xl">🔔</span>
		{#if unreadCount > 0}
			<span class="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
		{/if}
	</button>

	{#if showDropdown}
		<div class="dropdown">
			<div class="dropdown-header">
				<h3 class="text-lg font-bold">Notifications</h3>
				{#if unreadCount > 0}
					<button on:click={markAllAsRead} class="mark-all-read">Mark all as read</button>
				{/if}
			</div>

			{#if loading}
				<div class="loading">Loading...</div>
			{:else if notifications.length === 0}
				<p class="empty">No notifications yet</p>
			{:else}
				<div class="notifications-list">
					{#each notifications as notification (notification._id)}
						<button
							on:click={() => handleNotificationClick(notification)}
							class="notification-item {notification.read ? 'read' : 'unread'}"
						>
							<img
								src={notification.sender.image}
								alt={notification.sender.userName}
								class="avatar"
							/>
							<div class="content">
								<p class="message">{notification.message}</p>
								<span class="time">{formatTimeAgo(notification.createdAt)}</span>
							</div>
							{#if !notification.read}
								<span class="unread-dot"></span>
							{/if}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.notification-bell {
		position: relative;
	}

	.bell-button {
		position: relative;
		cursor: pointer;
		user-select: none;
	}

	.badge {
		position: absolute;
		top: 0;
		right: 0;
		background: #ef4444;
		color: white;
		border-radius: 9999px;
		min-width: 20px;
		height: 20px;
		font-size: 0.7rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 4px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.dropdown {
		position: absolute;
		right: 0;
		top: calc(100% + 0.5rem);
		background: var(--bg-tertiary);
		border: 1px solid var(--border-color);
		border-radius: 0.75rem;
		box-shadow: 0 10px 25px -5px var(--shadow-lg);
		width: 380px;
		max-width: 90vw;
		max-height: 500px;
		overflow: hidden;
		z-index: 1000;
		display: flex;
		flex-direction: column;
	}

	.dropdown-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		border-bottom: 1px solid var(--border-color);
	}

	.dropdown-header h3 {
		margin: 0;
		color: var(--text-primary);
	}

	.mark-all-read {
		background: none;
		border: none;
		color: var(--accent-primary);
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
		transition: background-color 0.2s;
	}

	.mark-all-read:hover {
		background: var(--accent-hover);
	}

	.notifications-list {
		overflow-y: auto;
		max-height: 400px;
	}

	.notification-item {
		width: 100%;
		display: flex;
		gap: 0.75rem;
		padding: 1rem;
		border-bottom: 1px solid var(--border-color);
		background: none;
		border: none;
		text-align: left;
		cursor: pointer;
		transition: background-color 0.2s;
		position: relative;
	}

	.notification-item:hover {
		background: var(--accent-hover);
	}

	.notification-item.unread {
		background: rgba(121, 191, 98, 0.1);
	}

	.notification-item:last-child {
		border-bottom: none;
	}

	.avatar {
		width: 40px;
		height: 40px;
		border-radius: 9999px;
		object-fit: cover;
		flex-shrink: 0;
	}

	.content {
		flex: 1;
		min-width: 0;
	}

	.message {
		margin: 0 0 0.25rem 0;
		font-size: 0.875rem;
		color: var(--text-primary);
		line-height: 1.4;
		word-wrap: break-word;
	}

	.time {
		font-size: 0.75rem;
		color: var(--text-tertiary);
	}

	.unread-dot {
		width: 8px;
		height: 8px;
		background: var(--accent-primary);
		border-radius: 9999px;
		flex-shrink: 0;
		margin-top: 0.5rem;
	}

	.loading,
	.empty {
		padding: 2rem;
		text-align: center;
		color: var(--text-secondary);
		font-size: 0.875rem;
	}

	@media (max-width: 640px) {
		.dropdown {
			width: 320px;
		}
	}
</style>
