<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authAPI } from '$lib/api/client';
	import { authStore } from '$lib/stores/auth';
	import { redirectIfAuthenticated } from '$lib/utils/guards';
	import SEO from '$lib/components/SEO.svelte';

	let userName = '';
	let email = '';
	let password = '';
	let confirmPassword = '';
	let profileImage: File | null = null;
	let favoriteGenres: string[] = [];
	let error = '';
	let isLoading = false;

	const availableGenres = ['Hip-Hop', 'Rock', 'Pop', 'Jazz', 'Classical'];

	// Redirect to feed if already authenticated
	onMount(() => {
		redirectIfAuthenticated();
	});

	function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			profileImage = target.files[0];
		}
	}

	function toggleGenre(genre: string) {
		if (favoriteGenres.includes(genre)) {
			favoriteGenres = favoriteGenres.filter((g) => g !== genre);
		} else {
			favoriteGenres = [...favoriteGenres, genre];
		}
	}

	async function handleSignup(event: Event) {
		event.preventDefault();
		error = '';
		isLoading = true;

		// Client-side validation
		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			isLoading = false;
			return;
		}

		if (password.length < 8) {
			error = 'Password must be at least 8 characters long';
			isLoading = false;
			return;
		}

		if (!profileImage) {
			error = 'Please upload a profile image';
			isLoading = false;
			return;
		}

		if (favoriteGenres.length === 0) {
			error = 'Please select at least one favorite genre';
			isLoading = false;
			return;
		}

		try {
			// Create FormData for multipart/form-data submission
			const formData = new FormData();
			formData.append('userName', userName);
			formData.append('email', email);
			formData.append('password', password);
			formData.append('confirmPassword', confirmPassword);
			formData.append('file', profileImage);

			// Append each genre separately (backend expects array)
			favoriteGenres.forEach((genre) => {
				formData.append('favoriteGenres[]', genre);
			});

			const response = await authAPI.signup(formData);

			if (response.success && response.user) {
				authStore.setUser(response.user);
				goto('/feed');
			} else {
				error = response.error || 'Signup failed';
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
				error = 'An error occurred during signup';
			}
			console.error('Signup error:', err);
		} finally {
			isLoading = false;
		}
	}
</script>

<SEO
	title="Sign Up"
	description="Join Hit.it and start collaborating with musicians worldwide. Create jams, share clips, and make music together."
/>

<div class="bg-primary-light flex min-h-screen items-center justify-center p-4 md:p-8">
	<div class="my-8 w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl md:p-10">
		<h1 class="mb-2 text-center text-3xl font-bold text-gray-800 md:text-4xl">Join Hit.it</h1>
		<p class="mb-8 text-center text-sm text-gray-600 md:text-base">
			Create an account to start making music with others.
		</p>

		{#if error}
			<div
				class="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
				role="alert"
			>
				{error}
			</div>
		{/if}

		<form on:submit={handleSignup} enctype="multipart/form-data" class="space-y-5">
			<div>
				<label for="userName" class="mb-2 block text-sm font-medium text-gray-700">Username</label>
				<input
					type="text"
					id="userName"
					bind:value={userName}
					required
					placeholder="Choose a username"
					disabled={isLoading}
					class="input-field disabled:cursor-not-allowed disabled:bg-gray-100"
				/>
			</div>

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
				<small class="mt-1 block text-xs text-gray-600"
					>We'll never share your email with anyone else.</small
				>
			</div>

			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<div>
					<label for="password" class="mb-2 block text-sm font-medium text-gray-700">Password</label
					>
					<input
						type="password"
						id="password"
						bind:value={password}
						required
						placeholder="At least 8 characters"
						disabled={isLoading}
						class="input-field disabled:cursor-not-allowed disabled:bg-gray-100"
					/>
				</div>

				<div>
					<label for="confirmPassword" class="mb-2 block text-sm font-medium text-gray-700"
						>Confirm Password</label
					>
					<input
						type="password"
						id="confirmPassword"
						bind:value={confirmPassword}
						required
						placeholder="Re-enter your password"
						disabled={isLoading}
						class="input-field disabled:cursor-not-allowed disabled:bg-gray-100"
					/>
				</div>
			</div>

			<div>
				<label for="profileImage" class="mb-2 block text-sm font-medium text-gray-700"
					>Profile Photo</label
				>
				<input
					type="file"
					id="profileImage"
					accept="image/*"
					on:change={handleFileChange}
					required
					disabled={isLoading}
					class="focus:border-primary focus:ring-primary/20 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
				/>
				{#if profileImage}
					<small class="text-primary mt-1 block text-xs font-medium"
						>Selected: {profileImage.name}</small
					>
				{/if}
			</div>

			<div class="rounded-lg border border-gray-300 p-4">
				<div class="mb-3 block text-sm font-medium text-gray-700">Choose your favorite genres:</div>
				<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
					{#each availableGenres as genre (genre)}
						<label
							class="hover:text-primary flex cursor-pointer items-center gap-2 transition-colors"
						>
							<input
								type="checkbox"
								value={genre}
								checked={favoriteGenres.includes(genre)}
								on:change={() => toggleGenre(genre)}
								disabled={isLoading}
								class="text-primary focus:ring-primary/20 h-4 w-4 cursor-pointer rounded border-gray-300 focus:ring-2"
							/>
							<span class="text-sm text-gray-700">{genre}</span>
						</label>
					{/each}
				</div>
			</div>

			<button
				type="submit"
				class="btn-primary mt-6 w-full py-3.5 text-base disabled:transform-none disabled:cursor-not-allowed disabled:opacity-60"
				disabled={isLoading}
			>
				{#if isLoading}
					Creating Account...
				{:else}
					Sign Up
				{/if}
			</button>
		</form>

		<p class="mt-6 text-center text-sm text-gray-600">
			Already have an account? <a href="/login" class="text-primary font-semibold hover:underline"
				>Login</a
			>
		</p>
	</div>
</div>
