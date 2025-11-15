<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authAPI } from '$lib/api/client';
	import { authStore } from '$lib/stores/auth';
	import { redirectIfAuthenticated } from '$lib/utils/guards';
	import SEO from '$lib/components/SEO.svelte';

	let email = '';
	let password = '';
	let error = '';
	let isLoading = false;

	// Redirect to feed if already authenticated
	onMount(() => {
		redirectIfAuthenticated();
	});

	async function handleLogin(event: Event) {
		event.preventDefault();
		error = '';
		isLoading = true;

		try {
			const response = await authAPI.login({ email, password });

			if (response.success && response.user) {
				authStore.setUser(response.user);
				goto('/feed');
			} else {
				error = response.error || 'Login failed';
			}
		} catch (err: unknown) {
			const apiError = err as {
				response?: { data?: { error?: string; errors?: Array<{ msg: string }> } };
			};
			if (apiError.response?.data?.error) {
				error = apiError.response.data.error;
			} else if (apiError.response?.data?.errors) {
				error = apiError.response.data.errors.map((e) => e.msg).join(', ');
			} else {
				error = 'An error occurred during login';
			}
			console.error('Login error:', err);
		} finally {
			isLoading = false;
		}
	}
</script>

<SEO
	title="Login"
	description="Log in to Hit.it to start collaborating on music jams and sharing your audio clips with the community."
/>

<div class="bg-primary-light flex min-h-screen items-center justify-center p-4 md:p-8">
	<div class="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl md:p-10">
		<h1 class="mb-2 text-center text-3xl font-bold text-gray-800 md:text-4xl">Login to Hit.it</h1>
		<p class="mb-8 text-center text-sm text-gray-600 md:text-base">
			Welcome back! Sign in to start jamming.
		</p>

		{#if error}
			<div
				class="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
				role="alert"
			>
				{error}
			</div>
		{/if}

		<form on:submit={handleLogin} class="space-y-6">
			<div>
				<label for="email" class="mb-2 block text-sm font-medium text-gray-700">Email</label>
				<input
					type="email"
					id="email"
					bind:value={email}
					required
					placeholder="your@email.com"
					disabled={isLoading}
					class="input-field disabled:cursor-not-allowed disabled:bg-gray-100"
				/>
			</div>

			<div>
				<label for="password" class="mb-2 block text-sm font-medium text-gray-700">Password</label>
				<input
					type="password"
					id="password"
					bind:value={password}
					required
					placeholder="Enter your password"
					disabled={isLoading}
					class="input-field disabled:cursor-not-allowed disabled:bg-gray-100"
				/>
			</div>

			<button
				type="submit"
				class="btn-primary w-full py-3.5 text-base disabled:transform-none disabled:cursor-not-allowed disabled:opacity-60"
				disabled={isLoading}
			>
				{#if isLoading}
					Logging in...
				{:else}
					Login
				{/if}
			</button>
		</form>

		<p class="mt-6 text-center text-sm text-gray-600">
			Don't have an account? <a href="/signup" class="text-primary font-semibold hover:underline"
				>Sign up</a
			>
		</p>
	</div>
</div>
