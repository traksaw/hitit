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
	isPrivate?: boolean;
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

// Phase 3: Collaboration Types

export type CollaboratorRole = 'producer' | 'contributor' | 'viewer';

export interface Collaborator {
	user: User;
	role: CollaboratorRole;
	addedAt: Date;
	addedBy: string | User;
}

export interface JamActivity {
	_id: string;
	jam: string | Jam;
	user: User;
	actionType: 'jam_created' | 'clip_added' | 'clip_removed' | 'mix_updated' |
		'collaborator_added' | 'collaborator_removed' | 'role_changed' |
		'invite_sent' | 'invite_accepted' | 'request_sent' | 'request_approved' |
		'comment_added' | 'jam_updated' | 'jam_published';
	targetUser?: User;
	targetClip?: Clip;
	metadata?: Record<string, unknown>;
	description: string;
	createdAt: Date;
}

export interface JamInvite {
	_id: string;
	jam: Jam;
	invitedUser: User;
	invitedBy: User;
	role: CollaboratorRole;
	status: 'pending' | 'accepted' | 'declined' | 'expired';
	message?: string;
	expiresAt: Date;
	respondedAt?: Date;
	createdAt: Date;
}

export interface JamRequest {
	_id: string;
	jam: Jam;
	requestedBy: User;
	requestedRole: CollaboratorRole;
	status: 'pending' | 'approved' | 'denied';
	message?: string;
	skills?: string[];
	portfolio?: string;
	respondedAt?: Date;
	respondedBy?: User;
	createdAt: Date;
}

export interface JamVersion {
	_id: string;
	jam: string | Jam;
	versionNumber: number;
	versionName: string;
	description?: string;
	createdBy: User;
	createdAt: Date;
	snapshot: {
		title: string;
		description?: string;
		genre: string;
		image?: string;
		isPrivate: boolean;
		audioElements: Clip[];
		collaborators: Collaborator[];
		clipCount: number;
		collaboratorCount: number;
	};
	tags: string[];
	isPinned: boolean;
}

export interface ActivityFeedResponse {
	success: boolean;
	activities: JamActivity[];
	pagination: {
		total: number;
		limit: number;
		skip: number;
		hasMore: boolean;
	};
}

export interface VersionsResponse {
	success: boolean;
	versions: JamVersion[];
	pagination: {
		total: number;
		limit: number;
		skip: number;
		hasMore: boolean;
	};
}

export interface InvitesResponse {
	success: boolean;
	invites: JamInvite[];
}

export interface RequestsResponse {
	success: boolean;
	requests: JamRequest[];
}
