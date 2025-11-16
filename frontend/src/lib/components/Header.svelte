<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth';
	import { authAPI } from '$lib/api/client';
	import ThemeToggle from './ThemeToggle.svelte';
	import NotificationBell from './NotificationBell.svelte';

	let isLoggingOut = false;

	async function handleLogout() {
		isLoggingOut = true;
		try {
			await authAPI.logout();
			authStore.clearUser();
			goto('/login');
		} catch (error) {
			console.error('Logout error:', error);
			// Still clear the store and redirect even if API call fails
			authStore.clearUser();
			goto('/login');
		} finally {
			isLoggingOut = false;
		}
	}
</script>

<header class="bg-primary-dark sticky top-0 z-50 text-white shadow-lg">
	<div
		class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-4 md:flex-row"
	>
		<a href="/feed" class="text-white no-underline transition-opacity hover:opacity-90">
			<h1 class="m-0 text-2xl font-bold md:text-3xl">Hit.it</h1>
		</a>

		<nav class="flex flex-wrap items-center justify-center gap-4 md:gap-6">
			{#if $authStore.isAuthenticated && $authStore.user}
				<a
					href="/feed"
					class="rounded-lg px-4 py-2 font-medium text-white no-underline transition-colors hover:bg-white/10"
				>
					Feed
				</a>
				<a
					href="/profile"
					class="rounded-lg px-4 py-2 font-medium text-white no-underline transition-colors hover:bg-white/10"
				>
					Profile
				</a>

				<ThemeToggle />
				<NotificationBell />

				<div class="flex items-center gap-3 pl-0 md:border-l md:border-white/30 md:pl-4">
					<img
						src={$authStore.user.image}
						alt={$authStore.user.userName}
						class="h-9 w-9 rounded-full border-2 border-white object-cover"
					/>
					<span class="hidden text-sm font-medium md:inline">{$authStore.user.userName}</span>
					<button
						on:click={handleLogout}
						disabled={isLoggingOut}
						class="cursor-pointer rounded-lg border border-white bg-white/20 px-4 py-2 font-medium text-white transition-colors hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{isLoggingOut ? 'Logging out...' : 'Logout'}
					</button>
				</div>
			{:else}
				<ThemeToggle />

				<a
					href="/login"
					class="rounded-lg px-4 py-2 font-medium text-white no-underline transition-colors hover:bg-white/10"
				>
					Login
				</a>
				<a
					href="/signup"
					class="rounded-lg border border-white bg-white/20 px-4 py-2 font-medium text-white no-underline transition-colors hover:bg-white/30"
				>
					Sign Up
				</a>
			{/if}
		</nav>
	</div>
</header>
