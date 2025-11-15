import { writable } from 'svelte/store';
import type { User as APIUser } from '$lib/api/types';

// Re-export User type from API
export type User = APIUser;

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
}

const initialState: AuthState = {
	user: null,
	isAuthenticated: false,
	isLoading: true // Start as loading to check session on app load
};

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>(initialState);

	return {
		subscribe,
		set,
		update,
		setUser: (user: User) => {
			update((state) => ({
				...state,
				user,
				isAuthenticated: true,
				isLoading: false
			}));
		},
		clearUser: () => {
			set({
				user: null,
				isAuthenticated: false,
				isLoading: false
			});
		},
		setLoading: (loading: boolean) => {
			update((state) => ({
				...state,
				isLoading: loading
			}));
		}
	};
}

export const authStore = createAuthStore();
