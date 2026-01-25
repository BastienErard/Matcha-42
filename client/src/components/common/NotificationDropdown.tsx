import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { useSocket } from '../../hooks/useSocket';
import { UserProfileModal } from './UserProfileModal';
import {
	getNotifications,
	getUnreadCount,
	markAsRead,
	markAllAsRead,
	type Notification,
} from '../../api';

export function NotificationDropdown() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const dropdownRef = useRef<HTMLDivElement>(null);

	const [isOpen, setIsOpen] = useState(false);
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);

	// Socket.io pour les notifications temps réel
	useSocket({
		onNotification: (socketNotification) => {
			// Ajoute la notification en haut de la liste
			const newNotif: Notification = {
				id: socketNotification.id,
				type: socketNotification.type,
				isRead: false,
				createdAt: socketNotification.createdAt,
				fromUser: socketNotification.fromUser,
			};

			setNotifications((prev) => [newNotif, ...prev.slice(0, 19)]); // Garde max 20
			setUnreadCount((prev) => prev + 1);
		},
	});

	// Charge le compteur au montage
	useEffect(() => {
		loadUnreadCount();
	}, []);

	// Ferme le dropdown si on clique en dehors
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		}

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	async function loadUnreadCount() {
		const result = await getUnreadCount();
		if (result.success && result.data) {
			setUnreadCount(result.data.unreadCount);
		}
	}

	async function loadNotifications() {
		setIsLoading(true);
		const result = await getNotifications(20, 0);
		if (result.success && result.data) {
			setNotifications(result.data.notifications);
			setUnreadCount(result.data.unreadCount);
		}
		setIsLoading(false);
	}

	function handleToggle() {
		if (!isOpen) {
			loadNotifications();
		}
		setIsOpen(!isOpen);
	}

	async function handleNotificationClick(notification: Notification) {
		// Marque comme lu si non lu
		if (!notification.isRead) {
			await markAsRead(notification.id);
			setNotifications((prev) =>
				prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
			);
			setUnreadCount((prev) => Math.max(0, prev - 1));
		}

		// Ferme le dropdown
		setIsOpen(false);

		// Ouvre le profil ou navigue selon le type
		if (notification.fromUser) {
			if (notification.type === 'message') {
				navigate('/messages');
			} else {
				setSelectedProfileId(notification.fromUser.id);
			}
		}
	}

	async function handleMarkAllAsRead() {
		const result = await markAllAsRead();
		if (result.success) {
			setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
			setUnreadCount(0);
		}
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
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return t('notifications.justNow');
		if (diffMins < 60) return t('notifications.minutesAgo').replace('{n}', String(diffMins));
		if (diffHours < 24) return t('notifications.hoursAgo').replace('{n}', String(diffHours));
		if (diffDays < 7) return t('notifications.daysAgo').replace('{n}', String(diffDays));

		return date.toLocaleDateString();
	}

	function getNotificationIcon(type: Notification['type']): string {
		switch (type) {
			case 'like':
				return '❤️';
			case 'unlike':
				return '💔';
			case 'visit':
				return '👀';
			case 'message':
				return '💬';
			case 'match':
				return '🎉';
			default:
				return '🔔';
		}
	}

	function getNotificationText(notification: Notification): string {
		const name = notification.fromUser?.firstName || t('notifications.someone');
		switch (notification.type) {
			case 'like':
				return t('notifications.likedYou').replace('{name}', name);
			case 'unlike':
				return t('notifications.unlikedYou').replace('{name}', name);
			case 'visit':
				return t('notifications.visitedYou').replace('{name}', name);
			case 'message':
				return t('notifications.messagedYou').replace('{name}', name);
			case 'match':
				return t('notifications.matchedYou').replace('{name}', name);
			default:
				return t('notifications.newNotification');
		}
	}

	return (
		<div className="relative" ref={dropdownRef}>
			{/* Bouton cloche */}
			<button
				onClick={handleToggle}
				className="relative text-text-secondary hover:text-primary transition-colors duration-200 p-2"
				aria-label={t('notifications.title')}
			>
				<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
					/>
				</svg>
				{unreadCount > 0 && (
					<span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-primary text-text-inverse text-xs rounded-full flex items-center justify-center font-medium">
						{unreadCount > 99 ? '99+' : unreadCount}
					</span>
				)}
			</button>

			{/* Dropdown */}
			{isOpen && (
				<div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface-elevated border border-border rounded-xl shadow-lg overflow-hidden z-50">
					{/* Header */}
					<div className="flex items-center justify-between px-4 py-3 border-b border-border">
						<h3 className="font-semibold text-text-primary">
							{t('notifications.title')}
						</h3>
						{unreadCount > 0 && (
							<button
								onClick={handleMarkAllAsRead}
								className="text-sm text-primary hover:underline"
							>
								{t('notifications.markAllRead')}
							</button>
						)}
					</div>

					{/* Liste */}
					<div className="max-h-96 overflow-y-auto">
						{isLoading ? (
							<div className="flex items-center justify-center py-8">
								<div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
							</div>
						) : notifications.length === 0 ? (
							<div className="py-8 text-center text-text-muted">
								{t('notifications.empty')}
							</div>
						) : (
							notifications.map((notification) => {
								const photoUrl = notification.fromUser
									? getPhotoUrl(notification.fromUser.profilePhoto)
									: null;

								return (
									<div
										key={notification.id}
										onClick={() => handleNotificationClick(notification)}
										className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-surface ${
											!notification.isRead ? 'bg-primary/5' : ''
										}`}
									>
										{/* Photo */}
										<div className="relative flex-shrink-0">
											{photoUrl ? (
												<img
													src={photoUrl}
													alt=""
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
											<span className="absolute -bottom-1 -right-1 text-sm">
												{getNotificationIcon(notification.type)}
											</span>
										</div>

										{/* Contenu */}
										<div className="flex-1 min-w-0">
											<p
												className={`text-sm ${
													notification.isRead
														? 'text-text-secondary'
														: 'text-text-primary font-medium'
												}`}
											>
												{getNotificationText(notification)}
											</p>
											<p className="text-xs text-text-muted mt-0.5">
												{formatTime(notification.createdAt)}
											</p>
										</div>

										{/* Indicateur non lu */}
										{!notification.isRead && (
											<div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
										)}
									</div>
								);
							})
						)}
					</div>
				</div>
			)}

			{/* Modal profil */}
			<UserProfileModal
				userId={selectedProfileId || 0}
				isOpen={selectedProfileId !== null}
				onClose={() => setSelectedProfileId(null)}
				onUserBlocked={() => setSelectedProfileId(null)}
			/>
		</div>
	);
}
