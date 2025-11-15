import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

export interface User {
	id: string;
	userName: string;
	email: string;
	image: string;
	favoriteGenres: string[];
}

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

function createAuthStore(): Writable<AuthState> & {
	setUser: (user: User) => void;
	clearUser: () => void;
	setLoading: (loading: boolean) => void;
} {
	const { subscribe, set, update } = writable<AuthState>(initialState);

	return {
		subscribe,
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
