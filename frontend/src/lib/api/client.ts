import axios from 'axios';
import type { Jam, Clip, Comment, FeedData, User } from './types';

// Get API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create axios instance with default config
const apiClient = axios.create({
	baseURL: API_URL,
	withCredentials: true, // Important: Send cookies with requests
	headers: {
		'Content-Type': 'application/json'
	}
});

// API functions organized by resource

export const jamAPI = {
	/**
	 * Get paginated jam feed
	 */
	getFeed: async (page: number = 1) => {
		const response = await apiClient.get<FeedData>(`/api/feed?page=${page}`);
		return response.data;
	},

	/**
	 * Get a single jam by ID (API endpoint with full details)
	 */
	getById: async (id: string) => {
		const response = await apiClient.get<{
			success: boolean;
			jam: Jam;
			audioClips: Clip[];
			collaborators: User[];
			comments: Comment[];
			myAvailableClips: Clip[];
			availableUsers: User[];
			isOwner: boolean;
		}>(`/clips/api/jam/${id}`);
		return response.data;
	},

	/**
	 * Create a new jam
	 */
	create: async (formData: FormData) => {
		const response = await apiClient.post<Jam>('/clips/createJam', formData, {
			headers: {
				'Content-Type': 'multipart/form-data'
			}
		});
		return response.data;
	},

	/**
	 * Like a jam
	 */
	like: async (jamId: string) => {
		const response = await apiClient.put(`/clips/likeJam/${jamId}`);
		return response.data;
	},

	/**
	 * Add a clip to a jam
	 */
	addClip: async (jamId: string, clipId: string) => {
		const response = await apiClient.put(`/clips/addClipToJam/${jamId}/${clipId}`);
		return response.data;
	},

	/**
	 * Remove a clip from a jam
	 */
	removeClip: async (jamId: string, clipId: string) => {
		const response = await apiClient.delete(`/clips/deleteClipFromJam/${jamId}/${clipId}`);
		return response.data;
	},

	/**
	 * Add a user to jam collaborators
	 */
	addCollaborator: async (jamId: string, userId: string) => {
		const response = await apiClient.put(`/clips/addUserToJam/${jamId}/${userId}`);
		return response.data;
	},

	/**
	 * Remove a user from jam collaborators
	 */
	removeCollaborator: async (jamId: string, userId: string) => {
		const response = await apiClient.delete(`/clips/deleteUserFromJam/${jamId}/${userId}`);
		return response.data;
	},

	/**
	 * Delete a jam
	 */
	delete: async (jamId: string) => {
		const response = await apiClient.delete(`/clips/deleteJam/${jamId}`);
		return response.data;
	}
};

export const clipAPI = {
	/**
	 * Upload a new clip
	 */
	create: async (formData: FormData) => {
		const response = await apiClient.post<Clip>('/clips/createClip', formData, {
			headers: {
				'Content-Type': 'multipart/form-data'
			}
		});
		return response.data;
	},

	/**
	 * Delete a clip
	 */
	delete: async (clipId: string) => {
		const response = await apiClient.delete(`/clips/deleteClip/${clipId}`);
		return response.data;
	}
};

export const commentAPI = {
	/**
	 * Add a comment to a jam
	 */
	create: async (jamId: string, commentText: string) => {
		const response = await apiClient.post<Comment>(`/clips/addCommentToJam/${jamId}`, {
			commentText
		});
		return response.data;
	},

	/**
	 * Like a comment
	 */
	like: async (commentId: string) => {
		const response = await apiClient.put(`/clips/likeComment/${commentId}`);
		return response.data;
	},

	/**
	 * Delete a comment
	 */
	delete: async (commentId: string) => {
		const response = await apiClient.delete(`/clips/deleteComment/${commentId}`);
		return response.data;
	}
};

export const authAPI = {
	/**
	 * Login user - Uses new API endpoint
	 */
	login: async (credentials: { email: string; password: string }) => {
		const response = await apiClient.post<{ success: boolean; user: User; error?: string }>(
			'/api/auth/login',
			credentials
		);
		return response.data;
	},

	/**
	 * Signup new user - Uses new API endpoint with FormData for file upload
	 */
	signup: async (formData: FormData) => {
		const response = await apiClient.post<{ success: boolean; user: User; error?: string }>(
			'/api/auth/signup',
			formData,
			{
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			}
		);
		return response.data;
	},

	/**
	 * Logout current user - Uses new API endpoint
	 */
	logout: async () => {
		const response = await apiClient.post<{ success: boolean; message: string }>(
			'/api/auth/logout'
		);
		return response.data;
	},

	/**
	 * Get current authenticated user - Uses new API endpoint
	 */
	getCurrentUser: async () => {
		const response = await apiClient.get<{ success: boolean; user: User; error?: string }>(
			'/api/auth/me'
		);
		return response.data;
	},

	/**
	 * Get current user profile (old endpoint - keep for backward compatibility)
	 */
	getProfile: async () => {
		const response = await apiClient.get<{
			user: User;
			clips: Clip[];
			jams: Jam[];
			collabJams: Jam[];
		}>('/profile');
		return response.data;
	},

	/**
	 * Get user profile by ID (or current user if no ID provided) - Uses new API endpoint
	 */
	getProfileData: async (userId?: string) => {
		const endpoint = userId ? `/api/profile/${userId}` : '/api/profile';
		const response = await apiClient.get<{
			success: boolean;
			user: User;
			clips: Clip[];
			jams: Jam[];
			collabJams: Jam[];
			isOwnProfile: boolean;
		}>(endpoint);
		return response.data;
	}
};

// Export the axios instance for custom requests
export default apiClient;
