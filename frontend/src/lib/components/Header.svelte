<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth';
	import { authAPI } from '$lib/api/client';

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

<header class="sticky top-0 z-50 bg-primary-dark text-white shadow-lg">
	<div class="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
		<a href="/feed" class="no-underline text-white hover:opacity-90 transition-opacity">
			<h1 class="text-2xl md:text-3xl font-bold m-0">Hit.it</h1>
		</a>

		<nav class="flex items-center gap-4 md:gap-6 flex-wrap justify-center">
			{#if $authStore.isAuthenticated && $authStore.user}
				<a
					href="/feed"
					class="text-white no-underline font-medium px-4 py-2 rounded-lg transition-colors hover:bg-white/10"
				>
					Feed
				</a>
				<a
					href="/profile"
					class="text-white no-underline font-medium px-4 py-2 rounded-lg transition-colors hover:bg-white/10"
				>
					Profile
				</a>

				<div class="flex items-center gap-3 pl-0 md:pl-4 md:border-l md:border-white/30">
					<img
						src={$authStore.user.image}
						alt={$authStore.user.userName}
						class="w-9 h-9 rounded-full object-cover border-2 border-white"
					/>
					<span class="font-medium text-sm hidden md:inline">{$authStore.user.userName}</span>
					<button
						on:click={handleLogout}
						disabled={isLoggingOut}
						class="bg-white/20 text-white border border-white px-4 py-2 rounded-lg font-medium cursor-pointer transition-colors hover:bg-white/30 disabled:opacity-60 disabled:cursor-not-allowed"
					>
						{isLoggingOut ? 'Logging out...' : 'Logout'}
					</button>
				</div>
			{:else}
				<a
					href="/login"
					class="text-white no-underline font-medium px-4 py-2 rounded-lg transition-colors hover:bg-white/10"
				>
					Login
				</a>
				<a
					href="/signup"
					class="bg-white/20 border border-white text-white no-underline font-medium px-4 py-2 rounded-lg transition-colors hover:bg-white/30"
				>
					Sign Up
				</a>
			{/if}
		</nav>
	</div>
</header>
