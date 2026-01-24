import { apiRequest } from './client';

export interface BrowseProfile {
	id: number;
	username: string;
	firstName: string;
	lastName: string;
	age: number | null;
	gender: string;
	city: string | null;
	country: string | null;
	latitude: number | null;
	longitude: number | null;
	fameRating: number;
	profilePhoto: string | null;
	distance: number | null;
	commonTagsCount: number;
	tags: string[];
	isOnline: boolean;
	lastLogin: string | null;
}

export interface BrowseFilters {
	minAge?: number;
	maxAge?: number;
	maxDistance?: number;
	minFame?: number;
	maxFame?: number;
	tags?: string[];
	location?: string;
}

export interface BrowseSort {
	sortBy: 'distance' | 'age' | 'fame' | 'tags';
	order: 'asc' | 'desc';
}

export interface BrowseResponse {
	profiles: BrowseProfile[];
	total: number;
	limit: number;
	offset: number;
}

export async function getSuggestions(
	filters: BrowseFilters = {},
	sort: BrowseSort = { sortBy: 'distance', order: 'asc' },
	limit: number = 20,
	offset: number = 0
) {
	const params = new URLSearchParams();

	// Pagination
	params.append('limit', String(limit));
	params.append('offset', String(offset));

	// Tri
	params.append('sortBy', sort.sortBy);
	params.append('order', sort.order);

	// Filtres
	if (filters.minAge) params.append('minAge', String(filters.minAge));
	if (filters.maxAge) params.append('maxAge', String(filters.maxAge));
	if (filters.maxDistance) params.append('maxDistance', String(filters.maxDistance));
	if (filters.minFame !== undefined) params.append('minFame', String(filters.minFame));
	if (filters.maxFame !== undefined) params.append('maxFame', String(filters.maxFame));
	if (filters.tags && filters.tags.length > 0) {
		params.append('tags', filters.tags.join(','));
	}
	if (filters.location) params.append('location', filters.location);

	return apiRequest<BrowseResponse>(`/browse/suggestions?${params.toString()}`);
}
