<script lang="ts">
	import { themeStore } from '$lib/stores/theme';

	function toggleTheme() {
		themeStore.toggle();
	}
</script>

<button
	on:click={toggleTheme}
	class="theme-toggle rounded-lg bg-white/10 px-3 py-2 text-sm font-medium transition-all hover:bg-white/20 dark:bg-black/10 dark:hover:bg-black/20"
	title="Toggle dark mode"
	aria-label="Toggle dark mode"
>
	{#if $themeStore === 'dark'}
		<span class="flex items-center gap-2">
			<span>Light Mode</span>
		</span>
	{:else}
		<span class="flex items-center gap-2">
			<span>Dark Mode</span>
		</span>
	{/if}
</button>

<style>
	.theme-toggle {
		cursor: pointer;
		user-select: none;
	}
</style>
