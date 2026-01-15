import { apiRequest } from './client';

export interface Photo {
	id: number;
	user_id: number;
	filename: string;
	filepath: string;
	is_profile_picture: boolean;
	upload_order: number;
	created_at: string;
}

// Récupérer ses photos
export async function getMyPhotos() {
	return apiRequest<{ photos: Photo[] }>('/photos');
}

// Upload une photo (utilise FormData, pas JSON)
export async function uploadPhoto(file: File) {
	const formData = new FormData();
	formData.append('photo', file);

	try {
		const response = await fetch('http://localhost:3000/api/photos', {
			method: 'POST',
			body: formData,
			credentials: 'include',
		});

		const data = await response.json();

		if (!response.ok) {
			return {
				success: false,
				error: { code: data.code || 'SERVER_ERROR' },
			};
		}

		return {
			success: true,
			data,
		};
	} catch (error) {
		return {
			success: false,
			error: { code: 'NETWORK_ERROR' },
		};
	}
}

// Supprimer une photo
export async function deletePhoto(photoId: number) {
	return apiRequest<{ message: string }>(`/photos/${photoId}`, {
		method: 'DELETE',
	});
}

// Définir comme photo de profil
export async function setProfilePicture(photoId: number) {
	return apiRequest<{ message: string }>(`/photos/${photoId}/profile`, {
		method: 'PUT',
	});
}

// Réordonner les photos
export async function reorderPhotos(photoIds: number[]) {
	return apiRequest<{ message: string }>('/photos/reorder', {
		method: 'PUT',
		body: JSON.stringify({ photoIds }),
	});
}
