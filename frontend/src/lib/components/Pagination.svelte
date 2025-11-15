<script lang="ts">
	export let currentPage: number;
	export let totalPages: number;
	export let onPageChange: (page: number) => void;

	$: hasPrevPage = currentPage > 1;
	$: hasNextPage = currentPage < totalPages;
	$: startPage = Math.max(1, currentPage - 2);
	$: endPage = Math.min(totalPages, currentPage + 2);
	$: pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
</script>

{#if totalPages > 1}
	<div class="pagination-container">
		<nav aria-label="Jam feed pagination">
			<ul class="pagination">
				<!-- Previous Button -->
				{#if hasPrevPage}
					<li class="page-item">
						<button
							class="page-link"
							on:click={() => onPageChange(currentPage - 1)}
							aria-label="Previous"
						>
							<span aria-hidden="true">&laquo; Previous</span>
						</button>
					</li>
				{:else}
					<li class="page-item disabled">
						<span class="page-link">&laquo; Previous</span>
					</li>
				{/if}

				<!-- First Page + Ellipsis -->
				{#if startPage > 1}
					<li class="page-item">
						<button class="page-link" on:click={() => onPageChange(1)}>1</button>
					</li>
					{#if startPage > 2}
						<li class="page-item disabled">
							<span class="page-link">...</span>
						</li>
					{/if}
				{/if}

				<!-- Page Numbers -->
				{#each pages as page (page)}
					<li class="page-item" class:active={page === currentPage}>
						<button class="page-link" on:click={() => onPageChange(page)}>{page}</button>
					</li>
				{/each}

				<!-- Last Page + Ellipsis -->
				{#if endPage < totalPages}
					{#if endPage < totalPages - 1}
						<li class="page-item disabled">
							<span class="page-link">...</span>
						</li>
					{/if}
					<li class="page-item">
						<button class="page-link" on:click={() => onPageChange(totalPages)}>{totalPages}</button
						>
					</li>
				{/if}

				<!-- Next Button -->
				{#if hasNextPage}
					<li class="page-item">
						<button
							class="page-link"
							on:click={() => onPageChange(currentPage + 1)}
							aria-label="Next"
						>
							<span aria-hidden="true">Next &raquo;</span>
						</button>
					</li>
				{:else}
					<li class="page-item disabled">
						<span class="page-link">Next &raquo;</span>
					</li>
				{/if}
			</ul>
		</nav>
		<p class="page-info">Page {currentPage} of {totalPages}</p>
	</div>
{/if}

<style>
	.pagination-container {
		margin: 3rem 0;
	}

	.pagination {
		display: flex;
		list-style: none;
		padding: 0;
		gap: 0.5rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.page-item button,
	.page-item span {
		padding: 0.5rem 1rem;
		border: 1px solid #ddd;
		background: #fff;
		color: #333;
		cursor: pointer;
		border-radius: 4px;
		transition: all 0.2s ease;
		font-size: 0.875rem;
	}

	.page-item button:hover:not(:disabled) {
		background: #00ff88;
		color: #000;
		border-color: #00ff88;
	}

	.page-item.active button {
		background: #00ff88;
		color: #000;
		border-color: #00ff88;
		font-weight: 600;
	}

	.page-item.disabled span {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.page-info {
		text-align: center;
		margin-top: 1rem;
		color: #666;
		font-size: 0.875rem;
	}
</style>
