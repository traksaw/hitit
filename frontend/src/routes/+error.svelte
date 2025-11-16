<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	// Get error details from the page store
	$: error = $page.error;
	$: status = $page.status;

	function goHome() {
		goto('/');
	}

	function goBack() {
		window.history.back();
	}
</script>

<svelte:head>
	<title>Error {status} - Hit.it</title>
</svelte:head>

<div class="error-page">
	<div class="error-container">
		<div class="error-icon">!</div>
		<h1 class="error-status">{status}</h1>
		<h2 class="error-title">
			{#if status === 404}
				Page Not Found
			{:else if status === 403}
				Access Denied
			{:else if status === 500}
				Server Error
			{:else}
				Something Went Wrong
			{/if}
		</h2>
		<p class="error-message">
			{#if error?.message}
				{error.message}
			{:else if status === 404}
				The page you're looking for doesn't exist.
			{:else if status === 403}
				You don't have permission to access this resource.
			{:else if status === 500}
				Our server encountered an error. Please try again later.
			{:else}
				An unexpected error occurred.
			{/if}
		</p>
		<div class="error-actions">
			<button on:click={goBack} class="btn-secondary">Go Back</button>
			<button on:click={goHome} class="btn-primary">Go Home</button>
		</div>
	</div>
</div>

<style>
	.error-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.error-container {
		background: white;
		border-radius: 1rem;
		padding: 3rem 2rem;
		max-width: 500px;
		width: 100%;
		text-align: center;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}

	.error-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.error-status {
		font-size: 6rem;
		font-weight: 800;
		margin: 0;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		line-height: 1;
	}

	.error-title {
		font-size: 1.75rem;
		color: #333;
		margin: 1rem 0;
	}

	.error-message {
		font-size: 1rem;
		color: #666;
		margin: 0 0 2rem 0;
		line-height: 1.6;
	}

	.error-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	.error-actions button {
		padding: 0.875rem 1.5rem;
		border: none;
		border-radius: 0.5rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-primary {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
	}

	.btn-secondary {
		background: white;
		color: #667eea;
		border: 2px solid #667eea !important;
	}

	.btn-secondary:hover {
		background: #f8f9fa;
		transform: translateY(-2px);
	}

	@media (max-width: 640px) {
		.error-container {
			padding: 2rem 1.5rem;
		}

		.error-status {
			font-size: 4rem;
		}

		.error-title {
			font-size: 1.5rem;
		}

		.error-actions {
			flex-direction: column;
		}

		.error-actions button {
			width: 100%;
		}
	}
</style>
