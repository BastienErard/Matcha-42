import { useState, useEffect, useRef } from 'react';
import { Layout } from '../../components/layout';
import { useTranslation } from '../../hooks/useTranslation';
import { useSocket } from '../../hooks/useSocket';
import { UserProfileModal } from '../../components/common';
import {
	getConversations,
	getMessages,
	sendMessage,
	markConversationAsRead,
	type Conversation,
	type Message,
} from '../../api';

export function MessagesPage() {
	const { t } = useTranslation();
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// État
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [newMessage, setNewMessage] = useState('');
	const [isLoadingConversations, setIsLoadingConversations] = useState(true);
	const [isLoadingMessages, setIsLoadingMessages] = useState(false);
	const [isSending, setIsSending] = useState(false);
	const [error, setError] = useState('');
	const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);

	// Socket.io pour le temps réel
	useSocket({
		onMessage: (socketMessage) => {
			// Ajoute le message si c'est la conversation active
			if (selectedConversation && socketMessage.conversationId === selectedConversation.id) {
				const newMsg: Message = {
					id: socketMessage.id,
					conversationId: socketMessage.conversationId,
					senderId: socketMessage.senderId,
					content: socketMessage.content,
					isRead: true,
					createdAt: socketMessage.createdAt,
				};
				setMessages((prev) => [...prev, newMsg]);

				// Marque comme lu
				markConversationAsRead(socketMessage.conversationId);
			}

			// Met à jour la liste des conversations
			setConversations((prev) => {
				const updated = prev.map((conv) => {
					if (conv.id === socketMessage.conversationId) {
						return {
							...conv,
							lastMessage: {
								content: socketMessage.content,
								createdAt: socketMessage.createdAt,
								isFromMe: false,
							},
							unreadCount:
								selectedConversation?.id === socketMessage.conversationId
									? 0
									: conv.unreadCount + 1,
							updatedAt: socketMessage.createdAt,
						};
					}
					return conv;
				});

				// Trie par date de mise à jour
				return updated.sort(
					(a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
				);
			});
		},
		onNotification: (notification) => {
			// Rafraîchit les conversations si c'est un match (nouvelle conversation possible)
			if (notification.type === 'match') {
				loadConversations();
			}
		},
		onOnlineStatus: (status) => {
			// Met à jour le statut dans la conversation sélectionnée
			// Ignore si l'utilisateur nous a bloqué
			if (selectedConversation && selectedConversation.otherUser.id === status.userId) {
				setSelectedConversation((prev) =>
					prev && !prev.otherUser.isBlockedByOther
						? { ...prev, otherUser: { ...prev.otherUser, isOnline: status.isOnline } }
						: prev
				);
			}

			// Met à jour dans la liste des conversations (sauf si bloqué)
			setConversations((prev) =>
				prev.map((conv) =>
					conv.otherUser.id === status.userId && !conv.otherUser.isBlockedByOther
						? { ...conv, otherUser: { ...conv.otherUser, isOnline: status.isOnline } }
						: conv
				)
			);
		},
		onBlockStatus: (status) => {
			// Met à jour le statut si blocage ou déblocage
			if (selectedConversation && selectedConversation.otherUser.id === status.userId) {
				setSelectedConversation((prev) =>
					prev
						? {
								...prev,
								otherUser: {
									...prev.otherUser,
									isBlockedByOther: status.isBlocked,
									isOnline: status.isBlocked ? false : prev.otherUser.isOnline,
								},
							}
						: null
				);
			}

			// Met à jour dans la liste des conversations
			setConversations((prev) =>
				prev.map((conv) =>
					conv.otherUser.id === status.userId
						? {
								...conv,
								otherUser: {
									...conv.otherUser,
									isBlockedByOther: status.isBlocked,
									isOnline: status.isBlocked ? false : conv.otherUser.isOnline,
								},
							}
						: conv
				)
			);
		},
	});

	// Charge les conversations au montage
	useEffect(() => {
		loadConversations();
	}, []);

	// Scroll automatique vers le bas quand nouveaux messages
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	async function loadConversations() {
		setIsLoadingConversations(true);
		const result = await getConversations();
		if (result.success && result.data) {
			setConversations(result.data.conversations);
		}
		setIsLoadingConversations(false);
	}

	async function selectConversation(conversation: Conversation) {
		setSelectedConversation(conversation);
		setMessages([]);
		setIsLoadingMessages(true);
		setError('');

		const result = await getMessages(conversation.id);
		if (result.success && result.data) {
			setMessages(result.data.messages);

			// Marque comme lu si non lu
			if (conversation.unreadCount > 0) {
				await markConversationAsRead(conversation.id);
				setConversations((prev) =>
					prev.map((c) => (c.id === conversation.id ? { ...c, unreadCount: 0 } : c))
				);
			}
		} else {
			setError(result.error?.code || 'SERVER_ERROR');
		}

		setIsLoadingMessages(false);
	}

	async function handleSendMessage(e: React.FormEvent) {
		e.preventDefault();

		if (!newMessage.trim() || !selectedConversation || isSending) return;

		setIsSending(true);
		setError('');

		const result = await sendMessage(selectedConversation.otherUser.id, newMessage.trim());

		if (result.success && result.data) {
			// Ajoute le message à la liste
			setMessages((prev) => [...prev, result.data!.message]);

			// Met à jour la conversation dans la liste
			setConversations((prev) => {
				const updated = prev.map((conv) => {
					if (conv.id === selectedConversation.id) {
						return {
							...conv,
							lastMessage: {
								content: newMessage.trim(),
								createdAt: result.data!.message.createdAt,
								isFromMe: true,
							},
							updatedAt: result.data!.message.createdAt,
						};
					}
					return conv;
				});
				return updated.sort(
					(a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
				);
			});

			setNewMessage('');
		} else {
			setError(result.error?.code || 'SERVER_ERROR');
		}

		setIsSending(false);
	}

	function getPhotoUrl(filename: string | null): string | null {
		if (!filename) return null;
		if (filename.startsWith('http://') || filename.startsWith('https://')) {
			return filename;
		}
		return `http://localhost:3000/uploads/${filename}`;
	}

	function formatTime(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffDays === 0) {
			return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		} else if (diffDays === 1) {
			return t('chat.yesterday');
		} else if (diffDays < 7) {
			return date.toLocaleDateString([], { weekday: 'short' });
		} else {
			return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
		}
	}

	function formatMessageTime(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	// Vue mobile : liste OU conversation
	const showConversationList = !selectedConversation;

	return (
		<Layout variant="authenticated">
			<div className="h-[calc(100vh-4rem)] flex">
				{/* Liste des conversations */}
				<div
					className={`w-full md:w-80 lg:w-96 border-r border-border bg-surface-elevated flex flex-col ${
						!showConversationList ? 'hidden md:flex' : 'flex'
					}`}
				>
					{/* Header */}
					<div className="p-4 border-b border-border">
						<h1 className="text-xl font-bold text-text-primary">{t('chat.title')}</h1>
					</div>

					{/* Liste */}
					<div className="flex-1 overflow-y-auto">
						{isLoadingConversations ? (
							<div className="flex items-center justify-center py-8">
								<div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
							</div>
						) : conversations.length === 0 ? (
							<div className="p-4 text-center text-text-muted">
								{t('chat.noConversations')}
							</div>
						) : (
							conversations.map((conversation) => {
								const photoUrl = getPhotoUrl(conversation.otherUser.profilePhoto);
								const isSelected = selectedConversation?.id === conversation.id;

								return (
									<div
										key={conversation.id}
										onClick={() => selectConversation(conversation)}
										className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${
											isSelected ? 'bg-primary/10' : 'hover:bg-surface'
										}`}
									>
										{/* Photo */}
										<div className="relative flex-shrink-0">
											{photoUrl ? (
												<img
													src={photoUrl}
													alt={conversation.otherUser.firstName}
													className="w-12 h-12 rounded-full object-cover"
												/>
											) : (
												<div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-text-muted">
													<svg
														className="w-6 h-6"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
														/>
													</svg>
												</div>
											)}
											{conversation.otherUser.isOnline && (
												<div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-surface-elevated" />
											)}
										</div>

										{/* Infos */}
										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between">
												<span className="font-medium text-text-primary truncate">
													{conversation.otherUser.firstName}
												</span>
												{conversation.lastMessage && (
													<span className="text-xs text-text-muted">
														{formatTime(
															conversation.lastMessage.createdAt
														)}
													</span>
												)}
											</div>
											{conversation.lastMessage && (
												<p className="text-sm text-text-muted truncate">
													{conversation.lastMessage.isFromMe && (
														<span className="text-text-secondary">
															{t('chat.you')}:{' '}
														</span>
													)}
													{conversation.lastMessage.content}
												</p>
											)}
										</div>

										{/* Badge non lu */}
										{conversation.unreadCount > 0 && (
											<div className="w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
												{conversation.unreadCount}
											</div>
										)}
									</div>
								);
							})
						)}
					</div>
				</div>

				{/* Zone de conversation */}
				<div
					className={`flex-1 flex flex-col bg-background ${
						showConversationList ? 'hidden md:flex' : 'flex'
					}`}
				>
					{selectedConversation ? (
						<>
							{/* Header conversation */}
							<div className="flex items-center gap-3 p-4 border-b border-border bg-surface-elevated">
								{/* Bouton retour mobile */}
								<button
									onClick={() => setSelectedConversation(null)}
									className="md:hidden p-2 -ml-2 text-text-secondary hover:text-text-primary"
								>
									<svg
										className="w-6 h-6"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M15 19l-7-7 7-7"
										/>
									</svg>
								</button>

								{/* Photo */}
								{getPhotoUrl(selectedConversation.otherUser.profilePhoto) ? (
									<img
										src={
											getPhotoUrl(
												selectedConversation.otherUser.profilePhoto
											)!
										}
										alt={selectedConversation.otherUser.firstName}
										className="w-10 h-10 rounded-full object-cover"
									/>
								) : (
									<div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-text-muted">
										<svg
											className="w-5 h-5"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
											/>
										</svg>
									</div>
								)}

								{/* Nom et statut */}
								<div>
									<h2
										onClick={() =>
											setSelectedProfileId(selectedConversation.otherUser.id)
										}
										className="font-semibold text-text-primary cursor-pointer hover:text-primary transition-colors"
									>
										{selectedConversation.otherUser.firstName}{' '}
										{selectedConversation.otherUser.lastName}
									</h2>
									<p className="text-xs text-text-muted">
										{selectedConversation.otherUser.isOnline
											? t('chat.online')
											: t('chat.offline')}
									</p>
								</div>
							</div>

							{/* Messages */}
							<div className="flex-1 overflow-y-auto p-4 space-y-4">
								{isLoadingMessages ? (
									<div className="flex items-center justify-center h-full">
										<div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
									</div>
								) : messages.length === 0 ? (
									<div className="flex items-center justify-center h-full text-text-muted">
										{t('chat.noMessages')}
									</div>
								) : (
									messages.map((message) => {
										const isFromMe =
											message.senderId !== selectedConversation.otherUser.id;

										return (
											<div
												key={message.id}
												className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
											>
												<div
													className={`max-w-[75%] px-4 py-2 rounded-2xl ${
														isFromMe
															? 'bg-primary text-white rounded-br-md'
															: 'bg-surface-elevated text-text-primary rounded-bl-md'
													}`}
												>
													<p className="whitespace-pre-wrap break-words">
														{message.content}
													</p>
													<p
														className={`text-xs mt-1 ${
															isFromMe
																? 'text-white/70'
																: 'text-text-muted'
														}`}
													>
														{formatMessageTime(message.createdAt)}
													</p>
												</div>
											</div>
										);
									})
								)}
								<div ref={messagesEndRef} />
							</div>

							{/* Erreur */}
							{error && (
								<div className="px-4 py-2 bg-error/10 border-t border-error/20 text-error text-sm">
									{t(`chat.errors.${error}`) || t(`errors.${error}`)}
								</div>
							)}

							{/* Input */}
							<form
								onSubmit={handleSendMessage}
								className="p-4 border-t border-border bg-surface-elevated"
							>
								<div className="flex gap-3">
									<input
										type="text"
										value={newMessage}
										onChange={(e) => setNewMessage(e.target.value)}
										placeholder={t('chat.placeholder')}
										className="flex-1 px-4 py-3 rounded-xl border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
										maxLength={2000}
									/>
									<button
										type="submit"
										disabled={!newMessage.trim() || isSending}
										className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
									>
										{isSending ? (
											<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
										) : (
											t('chat.send')
										)}
									</button>
								</div>
							</form>
						</>
					) : (
						/* Placeholder quand pas de conversation sélectionnée */
						<div className="flex-1 flex items-center justify-center text-text-muted">
							<div className="text-center">
								<svg
									className="w-16 h-16 mx-auto mb-4 opacity-50"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={1.5}
										d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
									/>
								</svg>
								<p>{t('chat.selectConversation')}</p>
							</div>
						</div>
					)}
				</div>
				{/* Modal profil */}
				<UserProfileModal
					userId={selectedProfileId || 0}
					isOpen={selectedProfileId !== null}
					onClose={() => setSelectedProfileId(null)}
					onUserBlocked={() => {
						setSelectedProfileId(null);
						loadConversations();
					}}
				/>
			</div>
		</Layout>
	);
}
