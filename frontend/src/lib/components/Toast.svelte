<script lang="ts">
	import { toast } from '$lib/stores/toast';

	function getIcon(type: string) {
		switch (type) {
			case 'success':
				return 'OK';
			case 'error':
				return 'ERR';
			case 'warning':
				return 'WARN';
			case 'info':
			default:
				return 'INFO';
		}
	}
</script>

<div class="toast-container">
	{#each $toast as toastItem (toastItem.id)}
		<div class="toast toast-{toastItem.type}" role="alert">
			<span class="toast-icon">{getIcon(toastItem.type)}</span>
			<span class="toast-message">{toastItem.message}</span>
			<button class="toast-close" on:click={() => toast.dismiss(toastItem.id)} aria-label="Close">
				×
			</button>
		</div>
	{/each}
</div>

<style>
	.toast-container {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 9999;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		pointer-events: none;
	}

	.toast {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		border-radius: 0.5rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		min-width: 300px;
		max-width: 500px;
		pointer-events: auto;
		animation: slideIn 0.3s ease-out;
		background: white;
		border-left: 4px solid;
	}

	@keyframes slideIn {
		from {
			transform: translateX(400px);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	.toast-success {
		border-left-color: #10b981;
	}

	.toast-error {
		border-left-color: #ef4444;
	}

	.toast-warning {
		border-left-color: #f59e0b;
	}

	.toast-info {
		border-left-color: #3b82f6;
	}

	.toast-icon {
		font-size: 1.25rem;
		font-weight: bold;
		flex-shrink: 0;
	}

	.toast-success .toast-icon {
		color: #10b981;
	}

	.toast-error .toast-icon {
		color: #ef4444;
	}

	.toast-warning .toast-icon {
		color: #f59e0b;
	}

	.toast-info .toast-icon {
		color: #3b82f6;
	}

	.toast-message {
		flex: 1;
		color: #333;
		font-size: 0.875rem;
		line-height: 1.4;
	}

	.toast-close {
		background: none;
		border: none;
		font-size: 1.5rem;
		color: #999;
		cursor: pointer;
		padding: 0;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: color 0.2s;
	}

	.toast-close:hover {
		color: #333;
	}

	@media (max-width: 640px) {
		.toast-container {
			top: auto;
			bottom: 1rem;
			left: 1rem;
			right: 1rem;
		}

		.toast {
			min-width: auto;
			width: 100%;
		}
	}
</style>
