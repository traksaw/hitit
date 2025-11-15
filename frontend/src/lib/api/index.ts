// Export all API functions and types
export { jamAPI, clipAPI, commentAPI, authAPI } from './client';
export type { User, Clip, Jam, Comment, FeedData, PaginatedResponse, ApiError } from './types';
export { default as apiClient } from './client';
