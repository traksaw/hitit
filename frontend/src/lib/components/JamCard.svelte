<script lang="ts">
	import type { Jam } from '$lib/api';
	import { base } from '$app/paths';

	export let jam: Jam;
</script>

<a
	href="{base}/jam/{jam._id}"
	class="group block text-inherit no-underline transition-all duration-300 hover:-translate-y-2"
>
	<div class="card flex h-full flex-col">
		<div class="h-48 w-full overflow-hidden bg-gray-100">
			<img
				src={jam.image}
				alt={jam.title}
				class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
			/>
		</div>
		<div class="flex flex-1 flex-col p-4">
			<h5 class="text-primary-deep mb-2 line-clamp-1 text-lg font-semibold">{jam.title}</h5>
			<p class="mb-4 line-clamp-2 flex-1 text-sm text-gray-700">{jam.description || ''}</p>
			<div class="mt-auto flex items-center justify-between text-sm">
				<span
					class="bg-primary-dark rounded px-2 py-1 text-xs font-semibold tracking-wide text-white uppercase"
				>
					{jam.genre}
				</span>
				<span class="flex items-center gap-1 text-gray-600">
					<span class="text-red-500">❤️</span>
					{jam.likes}
				</span>
			</div>
		</div>
	</div>
</a>
