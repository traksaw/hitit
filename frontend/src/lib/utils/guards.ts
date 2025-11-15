import { goto } from '$app/navigation';
import { get } from 'svelte/store';
import { authStore } from '$lib/stores/auth';

/**
 * Client-side route guard that checks if user is authenticated
 * Redirects to login page if not authenticated
 * Should be called in onMount or component initialization
 *
 * @returns true if authenticated, false if redirecting to login
 */
export function requireAuth(): boolean {
	const auth = get(authStore);

	if (!auth.isAuthenticated) {
		goto('/login');
		return false;
	}

	return true;
}

/**
 * Redirects to feed if user is already authenticated
 * Useful for login/signup pages
 *
 * @returns true if unauthenticated, false if redirecting to feed
 */
export function redirectIfAuthenticated(): boolean {
	const auth = get(authStore);

	if (auth.isAuthenticated) {
		goto('/feed');
		return false;
	}

	return true;
}
