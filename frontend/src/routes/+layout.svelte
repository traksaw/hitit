<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { authAPI } from '$lib/api/client';
	import { authStore } from '$lib/stores/auth';
	import { audioStore } from '$lib/stores/audio';
	import Header from '$lib/components/Header.svelte';
	import PlayerBar from '$lib/components/audio/PlayerBar.svelte';

	let { children } = $props();

	// Pages that shouldn't show the header
	const noHeaderPages = ['/login', '/signup'];

	// Use derived to compute showHeader reactively from the page store
	let showHeader = $derived(!noHeaderPages.includes($page.url.pathname));

	// Check authentication status on app load
	onMount(async () => {
		try {
			const response = await authAPI.getCurrentUser();
			if (response.success && response.user) {
				authStore.setUser(response.user);
			} else {
				authStore.clearUser();
			}
		} catch {
			// User is not authenticated, which is fine
			authStore.clearUser();
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if showHeader}
	<Header />
{/if}

<div class="pb-32">
	{@render children()}
</div>

<!-- Global Player Bar -->
<PlayerBar currentJam={$audioStore.currentJam} currentClipUrl={$audioStore.currentClipUrl} />
