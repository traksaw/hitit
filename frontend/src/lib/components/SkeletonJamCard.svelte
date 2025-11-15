<div class="skeleton-card">
	<div class="skeleton-image"></div>
	<div class="skeleton-body">
		<div class="skeleton-title"></div>
		<div class="skeleton-description"></div>
		<div class="skeleton-description short"></div>
		<div class="skeleton-footer">
			<div class="skeleton-badge"></div>
			<div class="skeleton-likes"></div>
		</div>
	</div>
</div>

<style>
	.skeleton-card {
		background: #fff;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}

	.skeleton-image {
		width: 100%;
		height: 200px;
		background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	@keyframes shimmer {
		0% {
			background-position: -200% 0;
		}
		100% {
			background-position: 200% 0;
		}
	}

	.skeleton-body {
		padding: 1rem;
	}

	.skeleton-title {
		height: 1.2rem;
		background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: 4px;
		margin-bottom: 0.75rem;
		width: 70%;
	}

	.skeleton-description {
		height: 0.875rem;
		background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: 4px;
		margin-bottom: 0.5rem;
	}

	.skeleton-description.short {
		width: 50%;
		margin-bottom: 1rem;
	}

	.skeleton-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: auto;
	}

	.skeleton-badge {
		height: 1.5rem;
		width: 80px;
		background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: 4px;
	}

	.skeleton-likes {
		height: 1rem;
		width: 50px;
		background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: 4px;
	}
</style>
