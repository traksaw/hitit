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
		} catch (err: any) {
			if (err.response?.data?.error) {
				error = err.response.data.error;
			} else if (err.response?.data?.errors) {
				error = err.response.data.errors.map((e: any) => e.msg).join(', ');
			} else {
				error = 'An error occurred during login';
			}
			console.error('Login error:', err);
		} finally {
			isLoading = false;
		}
	}
</script>

<SEO title="Login" description="Log in to Hit.it to start collaborating on music jams and sharing your audio clips with the community." />

<div class="flex justify-center items-center min-h-screen p-4 md:p-8 bg-primary-light">
	<div class="bg-white rounded-2xl p-8 md:p-10 w-full max-w-md shadow-2xl">
		<h1 class="text-3xl md:text-4xl font-bold text-gray-800 text-center mb-2">Login to Hit.it</h1>
		<p class="text-gray-600 text-center mb-8 text-sm md:text-base">Welcome back! Sign in to start jamming.</p>

		{#if error}
			<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm" role="alert">
				{error}
			</div>
		{/if}

		<form on:submit={handleLogin} class="space-y-6">
			<div>
				<label for="email" class="block mb-2 text-gray-700 font-medium text-sm">Email</label>
				<input
					type="email"
					id="email"
					bind:value={email}
					required
					placeholder="your@email.com"
					disabled={isLoading}
					class="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
				/>
			</div>

			<div>
				<label for="password" class="block mb-2 text-gray-700 font-medium text-sm">Password</label>
				<input
					type="password"
					id="password"
					bind:value={password}
					required
					placeholder="Enter your password"
					disabled={isLoading}
					class="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
				/>
			</div>

			<button type="submit" class="btn-primary w-full py-3.5 text-base disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none" disabled={isLoading}>
				{#if isLoading}
					Logging in...
				{:else}
					Login
				{/if}
			</button>
		</form>

		<p class="mt-6 text-center text-gray-600 text-sm">
			Don't have an account? <a href="/signup" class="text-primary font-semibold hover:underline">Sign up</a>
		</p>
	</div>
</div>
