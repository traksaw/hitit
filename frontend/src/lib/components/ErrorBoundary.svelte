<script lang="ts">
	import { onMount } from 'svelte';

	let { children } = $props();
	let hasError = $state(false);
	let errorMessage = $state('');

	// Handle errors in child components
	onMount(() => {
		const handleError = (event: ErrorEvent) => {
			console.error('ErrorBoundary caught error:', event.error);
			hasError = true;
			errorMessage = event.error?.message || 'An unexpected error occurred';
			event.preventDefault();
		};

		window.addEventListener('error', handleError);

		return () => {
			window.removeEventListener('error', handleError);
		};
	});

	function retry() {
		hasError = false;
		errorMessage = '';
		window.location.reload();
	}
</script>

{#if hasError}
	<div class="error-boundary">
		<div class="error-content">
			<div class="error-icon">⚠️</div>
			<h2>Something went wrong</h2>
			<p class="error-text">{errorMessage}</p>
			<button on:click={retry} class="retry-btn">Reload Page</button>
		</div>
	</div>
{:else}
	{@render children()}
{/if}

<style>
	.error-boundary {
		min-height: 400px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	.error-content {
		text-align: center;
		max-width: 400px;
		background: white;
		padding: 2rem;
		border-radius: 0.5rem;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	.error-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.error-content h2 {
		margin: 0 0 0.5rem 0;
		color: #333;
		font-size: 1.5rem;
	}

	.error-text {
		color: #666;
		margin: 0 0 1.5rem 0;
	}

	.retry-btn {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.2s;
	}

	.retry-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
	}
</style>
