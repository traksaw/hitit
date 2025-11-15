<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { authStore } from '$lib/stores/auth';

	export let jamId: string;

	interface Collaborator {
		id: string;
		userName: string;
		color: string;
		x: number;
		y: number;
		lastSeen: number;
	}

	let collaborators: Map<string, Collaborator> = new Map();
	let ws: WebSocket | null = null;
	let mouseX = 0;
	let mouseY = 0;

	// Generate a random color for each collaborator
	const colors = [
		'#FF6B6B',
		'#4ECDC4',
		'#45B7D1',
		'#FFA07A',
		'#98D8C8',
		'#F7DC6F',
		'#BB8FCE',
		'#85C1E2'
	];

	function getColorForUser(userId: string): string {
		const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
		return colors[hash % colors.length];
	}

	function handleMouseMove(event: MouseEvent) {
		mouseX = event.clientX;
		mouseY = event.clientY;

		// Send cursor position to server
		if (ws && ws.readyState === WebSocket.OPEN && $authStore.user) {
			ws.send(
				JSON.stringify({
					type: 'cursor_move',
					jamId,
					userId: $authStore.user.id,
					userName: $authStore.user.userName,
					x: mouseX,
					y: mouseY,
					timestamp: Date.now()
				})
			);
		}
	}

	onMount(() => {
		// Connect to WebSocket server (adjust URL as needed)
		const wsUrl = `ws://localhost:3000/collaboration`;
		ws = new WebSocket(wsUrl);

		ws.onopen = () => {
			console.log('WebSocket connected for collaboration');
			// Join the jam room
			if ($authStore.user) {
				ws?.send(
					JSON.stringify({
						type: 'join_jam',
						jamId,
						userId: $authStore.user.id,
						userName: $authStore.user.userName
					})
				);
			}
		};

		ws.onmessage = (event) => {
			const data = JSON.parse(event.data);

			if (data.type === 'cursor_move' && data.userId !== $authStore.user?.id) {
				// Update collaborator cursor position
				collaborators.set(data.userId, {
					id: data.userId,
					userName: data.userName,
					color: getColorForUser(data.userId),
					x: data.x,
					y: data.y,
					lastSeen: Date.now()
				});
				collaborators = collaborators; // Trigger reactivity
			} else if (data.type === 'user_joined') {
				console.log(`${data.userName} joined the jam`);
			} else if (data.type === 'user_left') {
				collaborators.delete(data.userId);
				collaborators = collaborators;
			}
		};

		ws.onerror = (error) => {
			console.error('WebSocket error:', error);
		};

		ws.onclose = () => {
			console.log('WebSocket connection closed');
		};

		// Add mouse move listener
		window.addEventListener('mousemove', handleMouseMove);

		// Clean up stale cursors every 5 seconds
		const cleanupInterval = setInterval(() => {
			const now = Date.now();
			const staleThreshold = 5000; // 5 seconds

			for (const [userId, collab] of collaborators.entries()) {
				if (now - collab.lastSeen > staleThreshold) {
					collaborators.delete(userId);
				}
			}
			collaborators = collaborators;
		}, 5000);

		return () => {
			clearInterval(cleanupInterval);
		};
	});

	onDestroy(() => {
		window.removeEventListener('mousemove', handleMouseMove);
		if (ws) {
			ws.close();
		}
	});
</script>

<!-- Render collaborator cursors -->
<div class="collaborator-cursors fixed inset-0 pointer-events-none z-50">
	{#each Array.from(collaborators.values()) as collaborator (collaborator.id)}
		<div
			class="cursor-wrapper absolute transition-all duration-100"
			style="left: {collaborator.x}px; top: {collaborator.y}px;"
		>
			<!-- Cursor SVG -->
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="drop-shadow-lg">
				<path
					d="M5.5 3.5L20.5 12L13 14L11 21L5.5 3.5Z"
					fill={collaborator.color}
					stroke="white"
					stroke-width="1.5"
				/>
			</svg>

			<!-- User name label -->
			<div
				class="cursor-label ml-6 -mt-2 px-2 py-1 rounded text-white text-xs font-semibold whitespace-nowrap shadow-lg"
				style="background-color: {collaborator.color};"
			>
				{collaborator.userName}
			</div>
		</div>
	{/each}
</div>

<style>
	.cursor-wrapper {
		transform-origin: top left;
	}

	.cursor-label {
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: scale(0.8);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
