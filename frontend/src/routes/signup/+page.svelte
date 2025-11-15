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
		} catch (err: any) {
			if (err.response?.data?.error) {
				error = err.response.data.error;
			} else if (err.response?.data?.errors) {
				error = err.response.data.errors.map((e: any) => e.msg).join(', ');
			} else {
				error = 'An error occurred during signup';
			}
			console.error('Signup error:', err);
		} finally {
			isLoading = false;
		}
	}
</script>

<SEO title="Sign Up" description="Join Hit.it and start collaborating with musicians worldwide. Create jams, share clips, and make music together." />

<div class="flex justify-center items-center min-h-screen p-4 md:p-8 bg-primary-light">
	<div class="bg-white rounded-2xl p-8 md:p-10 w-full max-w-2xl shadow-2xl my-8">
		<h1 class="text-3xl md:text-4xl font-bold text-gray-800 text-center mb-2">Join Hit.it</h1>
		<p class="text-gray-600 text-center mb-8 text-sm md:text-base">Create an account to start making music with others.</p>

		{#if error}
			<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm" role="alert">
				{error}
			</div>
		{/if}

		<form on:submit={handleSignup} enctype="multipart/form-data" class="space-y-5">
			<div>
				<label for="userName" class="block mb-2 text-gray-700 font-medium text-sm">Username</label>
				<input
					type="text"
					id="userName"
					bind:value={userName}
					required
					placeholder="Choose a username"
					disabled={isLoading}
					class="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
				/>
			</div>

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
				<small class="block mt-1 text-gray-600 text-xs">We'll never share your email with anyone else.</small>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-5">
				<div>
					<label for="password" class="block mb-2 text-gray-700 font-medium text-sm">Password</label>
					<input
						type="password"
						id="password"
						bind:value={password}
						required
						placeholder="At least 8 characters"
						disabled={isLoading}
						class="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
					/>
				</div>

				<div>
					<label for="confirmPassword" class="block mb-2 text-gray-700 font-medium text-sm">Confirm Password</label>
					<input
						type="password"
						id="confirmPassword"
						bind:value={confirmPassword}
						required
						placeholder="Re-enter your password"
						disabled={isLoading}
						class="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
					/>
				</div>
			</div>

			<div>
				<label for="profileImage" class="block mb-2 text-gray-700 font-medium text-sm">Profile Photo</label>
				<input
					type="file"
					id="profileImage"
					accept="image/*"
					on:change={handleFileChange}
					required
					disabled={isLoading}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm transition-colors focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-gray-100 disabled:cursor-not-allowed"
				/>
				{#if profileImage}
					<small class="block mt-1 text-primary font-medium text-xs">Selected: {profileImage.name}</small>
				{/if}
			</div>

			<div class="border border-gray-300 rounded-lg p-4">
				<div class="block mb-3 text-gray-700 font-medium text-sm">Choose your favorite genres:</div>
				<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
					{#each availableGenres as genre}
						<label class="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
							<input
								type="checkbox"
								value={genre}
								checked={favoriteGenres.includes(genre)}
								on:change={() => toggleGenre(genre)}
								disabled={isLoading}
								class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary/20 cursor-pointer"
							/>
							<span class="text-sm text-gray-700">{genre}</span>
						</label>
					{/each}
				</div>
			</div>

			<button type="submit" class="btn-primary w-full py-3.5 text-base mt-6 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none" disabled={isLoading}>
				{#if isLoading}
					Creating Account...
				{:else}
					Sign Up
				{/if}
			</button>
		</form>

		<p class="mt-6 text-center text-gray-600 text-sm">
			Already have an account? <a href="/login" class="text-primary font-semibold hover:underline">Login</a>
		</p>
	</div>
</div>
