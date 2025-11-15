<script lang="ts">
	import type { Jam } from '$lib/api';
	import { base } from '$app/paths';

	export let jam: Jam;
</script>

<a
	href="{base}/jam/{jam._id}"
	class="block no-underline text-inherit transition-all duration-300 hover:-translate-y-2 group"
>
	<div class="card h-full flex flex-col">
		<div class="w-full h-48 overflow-hidden bg-gray-100">
			<img
				src={jam.image}
				alt={jam.title}
				class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
			/>
		</div>
		<div class="p-4 flex-1 flex flex-col">
			<h5 class="text-lg font-semibold text-primary-deep mb-2 line-clamp-1">{jam.title}</h5>
			<p class="text-sm text-gray-700 mb-4 flex-1 line-clamp-2">{jam.description || ''}</p>
			<div class="flex justify-between items-center text-sm mt-auto">
				<span class="bg-primary-dark text-white px-2 py-1 rounded font-semibold text-xs uppercase tracking-wide">
					{jam.genre}
				</span>
				<span class="text-gray-600 flex items-center gap-1">
					<span class="text-red-500">❤️</span>
					{jam.likes}
				</span>
			</div>
		</div>
	</div>
</a>
