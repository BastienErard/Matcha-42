import { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { translateTag } from '../../utils/tags';
import {
	getUserProfile,
	likeUser,
	unlikeUser,
	blockUser,
	unblockUser,
	reportUser,
	type UserProfile,
	type UserInteraction,
} from '../../api';

interface UserProfileModalProps {
	userId: number;
	isOpen: boolean;
	onClose: () => void;
	onUserBlocked?: (userId: number) => void;
	onUserUnblocked?: (userId: number) => void;
	onInteractionChange?: () => void;
}

export function UserProfileModal({
	userId,
	isOpen,
	onClose,
	onUserBlocked,
	onUserUnblocked,
	onInteractionChange,
}: UserProfileModalProps) {
	const { t } = useTranslation();

	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [interaction, setInteraction] = useState<UserInteraction | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState('');

	const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
	const [isActionLoading, setIsActionLoading] = useState(false);
	const [actionError, setActionError] = useState('');
	const [showMatchAlert, setShowMatchAlert] = useState(false);

	useEffect(() => {
		if (isOpen && userId) {
			loadProfile();
		}
	}, [isOpen, userId]);

	useEffect(() => {
		setCurrentPhotoIndex(0);
	}, [userId]);

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	}, [isOpen]);

	async function loadProfile() {
		setIsLoading(true);
		setError('');
		setActionError('');

		const result = await getUserProfile(userId);

		if (result.success && result.data) {
			setProfile(result.data.profile);
			setInteraction(result.data.interaction);
		} else {
			setError(result.error?.code || 'SERVER_ERROR');
		}

		setIsLoading(false);
	}

	function getPhotoUrl(filename: string): string {
		if (filename.startsWith('http://') || filename.startsWith('https://')) {
			return filename;
		}
		return `http://localhost:3000/uploads/${filename}`;
	}

	function formatLastLogin(lastLogin: string | null): string {
		if (!lastLogin) return t('userProfile.unknownLastLogin');

		const date = new Date(lastLogin);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 60) {
			return t('userProfile.lastLoginMinutes').replace('{n}', String(diffMins));
		} else if (diffHours < 24) {
			return t('userProfile.lastLoginHours').replace('{n}', String(diffHours));
		} else {
			return t('userProfile.lastLoginDays').replace('{n}', String(diffDays));
		}
	}

	async function handleLike() {
		if (!interaction || interaction.hasBlocked) return;

		setIsActionLoading(true);
		setActionError('');

		if (interaction.hasLiked) {
			const result = await unlikeUser(userId);
			if (result.success) {
				setInteraction((prev) =>
					prev ? { ...prev, hasLiked: false, isConnected: false } : null
				);
				onInteractionChange?.();
			} else {
				setActionError(result.error?.code || 'SERVER_ERROR');
			}
		} else {
			const result = await likeUser(userId);
			if (result.success && result.data) {
				setInteraction((prev) =>
					prev ? { ...prev, hasLiked: true, isConnected: result.data!.isMatch } : null
				);
				if (result.data.isMatch) {
					setShowMatchAlert(true);
					setTimeout(() => setShowMatchAlert(false), 3000);
				}
				onInteractionChange?.();
			} else {
				setActionError(result.error?.code || 'SERVER_ERROR');
			}
		}

		setIsActionLoading(false);
	}

	async function handleBlock() {
		if (!confirm(t('userProfile.confirmBlock'))) return;

		setIsActionLoading(true);
		setActionError('');

		const result = await blockUser(userId);

		if (result.success) {
			onUserBlocked?.(userId);
			onClose();
		} else {
			setActionError(result.error?.code || 'SERVER_ERROR');
		}

		setIsActionLoading(false);
	}

	async function handleUnblock() {
		setIsActionLoading(true);
		setActionError('');

		const result = await unblockUser(userId);

		if (result.success) {
			setInteraction((prev) => (prev ? { ...prev, hasBlocked: false } : null));
			onUserUnblocked?.(userId);
			onInteractionChange?.();
		} else {
			setActionError(result.error?.code || 'SERVER_ERROR');
		}

		setIsActionLoading(false);
	}

	async function handleReport() {
		if (!confirm(t('userProfile.confirmReport'))) return;

		setIsActionLoading(true);
		setActionError('');

		const result = await reportUser(userId);

		if (result.success) {
			alert(t('userProfile.reportSuccess'));
		} else {
			setActionError(result.error?.code || 'SERVER_ERROR');
		}

		setIsActionLoading(false);
	}

	if (!isOpen) return null;

	return (
<div className="fixed inset-0 z-[9999] flex items-center justify-center">
			{/* Overlay */}
			<div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

			{/* Modal */}
			<div className="relative w-full h-full md:h-auto md:max-h-[90vh] md:max-w-lg bg-surface-elevated md:rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-border">
				{/* Header avec bouton fermer */}
				<div className="absolute top-4 right-4 z-10">
					<button
						onClick={onClose}
						className="w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
						aria-label={t('common.close')}
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
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				{/* Contenu */}
				{isLoading ? (
					<div className="flex-1 flex items-center justify-center p-8 bg-background">
						<div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
					</div>
				) : error ? (
					<div className="flex-1 flex items-center justify-center p-8 bg-background">
						<div className="text-center">
							<p className="text-error mb-4">{t(`errors.${error}`)}</p>
							<button onClick={loadProfile} className="text-primary hover:underline">
								{t('common.retry')}
							</button>
						</div>
					</div>
				) : profile ? (
					<div className="flex-1 overflow-y-auto bg-background">
						{/* Bannière si bloqué */}
						{interaction?.hasBlocked && (
							<div className="bg-error/10 border-b border-error/20 px-4 py-3 text-center">
								<p className="text-error text-sm font-medium">
									🚫 {t('userProfile.youBlockedThisUser')}
								</p>
							</div>
						)}

						{/* Carousel photos */}
						<div className="relative aspect-square bg-surface">
							{profile.photos.length > 0 ? (
								<>
									<img
										src={getPhotoUrl(
											profile.photos[currentPhotoIndex].filename
										)}
										alt={profile.username}
										className="w-full h-full object-cover"
									/>

									{/* Dots de navigation */}
									{profile.photos.length > 1 && (
										<div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
											{profile.photos.map((_, index) => (
												<button
													key={index}
													onClick={() => setCurrentPhotoIndex(index)}
													className={`w-2.5 h-2.5 rounded-full transition-all ${
														index === currentPhotoIndex
															? 'bg-white scale-110'
															: 'bg-white/50 hover:bg-white/75'
													}`}
													aria-label={`Photo ${index + 1}`}
												/>
											))}
										</div>
									)}

									{/* Match alert */}
									{showMatchAlert && (
										<div className="absolute inset-0 flex items-center justify-center bg-black/50">
											<div className="bg-primary text-white px-8 py-6 rounded-2xl text-2xl font-bold animate-bounce">
												🎉 {t('userProfile.itsAMatch')}
											</div>
										</div>
									)}
								</>
							) : (
								<div className="w-full h-full flex items-center justify-center text-text-muted bg-surface-elevated">
									<svg
										className="w-24 h-24"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={1}
											d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
										/>
									</svg>
								</div>
							)}
						</div>

						{/* Infos profil */}
						<div className="p-6 space-y-5">
							{/* Nom, âge, statut en ligne */}
							<div className="flex items-start justify-between">
								<div>
									<h2 className="text-2xl font-bold text-text-primary">
										{profile.firstName} {profile.lastName}
										{profile.age && (
											<span className="font-normal text-text-secondary ml-2">
												{profile.age}
											</span>
										)}
									</h2>
									<p className="text-text-muted">@{profile.username}</p>
								</div>

								{/* Statut en ligne */}
								<div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-full">
									<span
										className={`w-2.5 h-2.5 rounded-full ${
											profile.isOnline
												? 'bg-green-500 animate-pulse'
												: 'bg-gray-400'
										}`}
									/>
									<span className="text-sm text-text-muted">
										{profile.isOnline
											? t('userProfile.online')
											: formatLastLogin(profile.lastLogin)}
									</span>
								</div>
							</div>

							{/* Localisation et fame rating */}
							<div className="flex flex-wrap gap-3">
								{profile.city && (
									<span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface rounded-full text-sm text-text-secondary">
										📍 {profile.city}
										{profile.country && `, ${profile.country}`}
									</span>
								)}
								<span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-full text-sm text-primary font-medium">
									🔥 {profile.fameRating}
								</span>
							</div>

							{/* Indicateurs d'intérêt */}
							{interaction && !interaction.hasBlocked && (
								<div className="flex flex-wrap gap-2">
									{interaction.hasLikedMe && !interaction.hasLiked && (
										<span className="px-4 py-2 bg-pink-500/10 text-pink-500 rounded-full text-sm font-medium">
											💕 {t('userProfile.likesYou')}
										</span>
									)}
									{interaction.isConnected && (
										<span className="px-4 py-2 bg-green-500/10 text-green-500 rounded-full text-sm font-medium">
											✨ {t('userProfile.connected')}
										</span>
									)}
								</div>
							)}

							{/* Biographie */}
							{profile.biography && (
								<div className="bg-surface rounded-xl p-4">
									<h3 className="font-semibold text-text-primary mb-2">
										{t('userProfile.about')}
									</h3>
									<p className="text-text-secondary whitespace-pre-line leading-relaxed">
										{profile.biography}
									</p>
								</div>
							)}

							{/* Tags */}
							{profile.tags.length > 0 && (
								<div>
									<h3 className="font-semibold text-text-primary mb-3">
										{t('userProfile.interests')}
									</h3>
									<div className="flex flex-wrap gap-2">
										{profile.tags.map((tag) => (
											<span
												key={tag}
												className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
											>
												#{translateTag(tag, t)}
											</span>
										))}
									</div>
								</div>
							)}

							{/* Erreur d'action */}
							{actionError && (
								<div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
									{t(`errors.${actionError}`)}
								</div>
							)}

							{/* Actions */}
							{interaction && (
								<div className="pt-2">
									{interaction.hasBlocked ? (
										/* Si bloqué : bouton débloquer uniquement */
										<button
											onClick={handleUnblock}
											disabled={isActionLoading}
											className="w-full py-3.5 px-4 rounded-xl font-medium bg-surface border border-border text-text-primary hover:bg-surface-elevated transition-colors disabled:opacity-50"
										>
											{t('userProfile.unblock')}
										</button>
									) : (
										/* Sinon : Like + Block + Report */
										<div className="flex gap-3">
											<button
												onClick={handleLike}
												disabled={isActionLoading}
												className={`flex-1 py-3.5 px-4 rounded-xl font-medium transition-colors disabled:opacity-50 ${
													interaction.hasLiked
														? 'bg-surface border border-border text-text-primary hover:bg-surface-elevated'
														: 'bg-primary text-white hover:bg-primary-hover'
												}`}
											>
												{interaction.hasLiked
													? t('userProfile.unlike')
													: t('userProfile.like')}
											</button>

											<button
												onClick={handleBlock}
												disabled={isActionLoading}
												className="py-3.5 px-4 rounded-xl border border-border text-text-secondary hover:bg-surface hover:text-error transition-colors disabled:opacity-50"
												title={t('userProfile.block')}
											>
												🚫
											</button>

											<button
												onClick={handleReport}
												disabled={isActionLoading}
												className="py-3.5 px-4 rounded-xl border border-border text-text-secondary hover:bg-surface hover:text-orange-500 transition-colors disabled:opacity-50"
												title={t('userProfile.report')}
											>
												⚠️
											</button>
										</div>
									)}
								</div>
							)}
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}
