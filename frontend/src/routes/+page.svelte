<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import SEO from '$lib/components/SEO.svelte';

	onMount(() => {
		// Redirect to feed page
		goto(`${base}/feed`);
	});
</script>

<SEO
	title="Home"
	description="Hit.it - The ultimate platform for music collaboration. Create jams, share audio clips, and collaborate with musicians from around the world."
/>

<div class="loading">
	<p>Redirecting to feed...</p>
</div>

<style>
	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100vh;
		font-size: 1.2rem;
		color: #666;
	}
</style>
