<script lang="ts">
	import type { Jam } from '$lib/api';

	export let jam: Jam;
</script>

<a href="/jam/{jam._id}" class="jam-card">
	<div class="card">
		<div class="card-img">
			<img src={jam.image} alt={jam.title} class="img-fluid" />
		</div>
		<div class="card-body">
			<h5 class="card-title">{jam.title}</h5>
			<p class="card-description">{jam.description || ''}</p>
			<div class="card-meta">
				<span class="genre">{jam.genre}</span>
				<span class="likes">❤️ {jam.likes}</span>
			</div>
		</div>
	</div>
</a>

<style>
	.jam-card {
		display: block;
		text-decoration: none;
		color: inherit;
		transition: transform 0.2s ease;
	}

	.jam-card:hover {
		transform: translateY(-4px);
	}

	.card {
		background: #fff;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transition: box-shadow 0.2s ease;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.jam-card:hover .card {
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
	}

	.card-img {
		width: 100%;
		height: 200px;
		overflow: hidden;
		background: #f0f0f0;
	}

	.card-img img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.card-body {
		padding: 1rem;
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.card-title {
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
		color: #00ff88;
	}

	.card-description {
		font-size: 0.875rem;
		color: #666;
		margin: 0 0 1rem 0;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.card-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.875rem;
		margin-top: auto;
	}

	.genre {
		background: #00ff88;
		color: #000;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-weight: 600;
		font-size: 0.75rem;
	}

	.likes {
		color: #666;
	}
</style>
