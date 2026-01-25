import { apiRequest } from './client';

export interface ConversationUser {
	id: number;
	username: string;
	firstName: string;
	lastName: string;
	profilePhoto: string | null;
	isOnline: boolean;
	lastLogin: string | null;
	isBlockedByOther?: boolean;
}

export interface Conversation {
	id: number;
	otherUser: ConversationUser;
	lastMessage: {
		content: string;
		createdAt: string;
		isFromMe: boolean;
	} | null;
	unreadCount: number;
	updatedAt: string;
}

export interface Message {
	id: number;
	conversationId: number;
	senderId: number;
	content: string;
	isRead: boolean;
	createdAt: string;
}

export interface ConversationsResponse {
	conversations: Conversation[];
}

export interface MessagesResponse {
	messages: Message[];
	total: number;
	hasMore: boolean;
}

export interface SendMessageResponse {
	message: Message;
	conversationId: number;
}

export interface ChatUnreadCountResponse {
	unreadCount: number;
}

export async function getConversations() {
	return apiRequest<ConversationsResponse>('/chat/conversations');
}

export async function getMessages(conversationId: number, limit: number = 50, offset: number = 0) {
	return apiRequest<MessagesResponse>(
		`/chat/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`
	);
}

export async function sendMessage(receiverId: number, content: string) {
	return apiRequest<SendMessageResponse>('/chat/messages', {
		method: 'POST',
		body: JSON.stringify({ receiverId, content }),
	});
}

export async function markConversationAsRead(conversationId: number) {
	return apiRequest<{ message: string }>(`/chat/conversations/${conversationId}/read`, {
		method: 'PUT',
	});
}

export async function getChatUnreadCount() {
	return apiRequest<ChatUnreadCountResponse>('/chat/unread-count');
}
