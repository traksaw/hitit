// API Type Definitions

export interface User {
	_id: string;
	userName: string;
	email: string;
	favoriteGenres?: string[];
	image?: string;
	fileName?: string;
	cloudinaryId?: string;
}

export interface Clip {
	_id: string;
	title: string;
	fileName: string;
	cloudinaryId: string;
	audio: string;
	description: string;
	genre?: string;
	likes: number;
	BPM?: number;
	user: string | User;
	createdAt: Date;
}

export interface Jam {
	_id: string;
	title: string;
	audioElements: Clip[];
	fileName: string;
	cloudinaryId?: string;
	cloudinaryImageId?: string;
	description?: string;
	image?: string;
	likes: number;
	collaborators: User[];
	genre: string;
	comments: Comment[];
	user: string | User;
	createdAt: Date;
}

export interface Comment {
	_id: string;
	commentText: string;
	likes: number;
	user: string | User;
	jam: string;
	createdAt: Date;
}

export interface PaginatedResponse<T> {
	data: T;
	currentPage: number;
	totalPages: number;
	hasNextPage: boolean;
	hasPrevPage: boolean;
}

export interface FeedData {
	jams: Jam[];
	hipHopJams: Jam[];
	popJams: Jam[];
	genreFavJams: Record<string, Jam[]>;
	currentPage: number;
	totalPages: number;
	hasNextPage: boolean;
	hasPrevPage: boolean;
}

export interface ApiError {
	message: string;
	status?: number;
}
