import { apiRequest } from './client';

export interface NotificationUser {
	id: number;
	username: string;
	firstName: string;
	profilePhoto: string | null;
}

export interface Notification {
	id: number;
	type: 'like' | 'unlike' | 'visit' | 'message' | 'match';
	isRead: boolean;
	createdAt: string;
	fromUser: NotificationUser | null;
}

export interface NotificationsResponse {
	notifications: Notification[];
	unreadCount: number;
}

export interface UnreadCountResponse {
	unreadCount: number;
}

export async function getNotifications(limit: number = 20, offset: number = 0) {
	return apiRequest<NotificationsResponse>(`/notifications?limit=${limit}&offset=${offset}`);
}

export async function getUnreadCount() {
	return apiRequest<UnreadCountResponse>('/notifications/unread-count');
}

export async function markAsRead(notificationId: number) {
	return apiRequest<{ message: string }>(`/notifications/${notificationId}/read`, {
		method: 'PUT',
	});
}

export async function markAllAsRead() {
	return apiRequest<{ message: string; count: number }>('/notifications/read-all', {
		method: 'PUT',
	});
}
