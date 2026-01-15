import { useState, useRef } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { uploadPhoto, deletePhoto, setProfilePicture, getMyPhotos, type Photo } from '../../api';

interface PhotoUploaderProps {
	photos: Photo[];
	onPhotosChange: (photos: Photo[]) => void;
	maxPhotos?: number;
}

export function PhotoUploader({ photos, onPhotosChange, maxPhotos = 5 }: PhotoUploaderProps) {
	const { t } = useTranslation();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [isUploading, setIsUploading] = useState(false);
	const [error, setError] = useState('');

	// Trie les photos : photo de profil en premier
	const sortedPhotos = [...photos].sort((a, b) => {
		if (a.is_profile_picture) return -1;
		if (b.is_profile_picture) return 1;
		return a.upload_order - b.upload_order;
	});

	async function reloadPhotos() {
		const result = await getMyPhotos();
		if (result.success && result.data) {
			onPhotosChange(result.data.photos);
		}
	}

	async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;

		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}

		if (photos.length >= maxPhotos) {
			setError('MAX_PHOTOS_REACHED');
			return;
		}

		setError('');
		setIsUploading(true);

		const result = await uploadPhoto(file);

		if (result.success) {
			await reloadPhotos();
		} else {
			setError(result.error?.code || 'SERVER_ERROR');
		}

		setIsUploading(false);
	}

	async function handleDelete(photoId: number) {
		const result = await deletePhoto(photoId);

		if (result.success) {
			await reloadPhotos();
		} else {
			setError(result.error?.code || 'SERVER_ERROR');
		}
	}

	async function handleSetProfile(photoId: number) {
		const result = await setProfilePicture(photoId);

		if (result.success) {
			await reloadPhotos();
		} else {
			setError(result.error?.code || 'SERVER_ERROR');
		}
	}

	function getPhotoUrl(photo: Photo) {
		return `http://localhost:3000/uploads/${photo.filename}`;
	}

	return (
		<div className="space-y-4">
			{error && (
				<div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
					{t(`errors.${error}`)}
				</div>
			)}

			{/* Grille : 2 colonnes mobile, 3 en desktop */}
			<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
				{sortedPhotos.map((photo) => (
					<div
						key={photo.id}
						className={`relative aspect-square rounded-lg overflow-hidden border-2 group ${
							photo.is_profile_picture ? 'border-primary' : 'border-border'
						}`}
					>
						<img
							src={getPhotoUrl(photo)}
							alt=""
							className="w-full h-full object-cover"
						/>

						{/* Bouton supprimer (icône X) */}
						<button
							type="button"
							onClick={() => handleDelete(photo.id)}
							className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-error rounded-full flex items-center justify-center transition-colors"
							title={t('onboarding.deletePhoto')}
						>
							<svg
								className="w-4 h-4 text-white"
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

						{/* Bouton "Définir comme profil" - seulement si pas déjà profil */}
						{!photo.is_profile_picture && (
							<div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
								<button
									type="button"
									onClick={() => handleSetProfile(photo.id)}
									className="w-full px-2 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs rounded transition-colors font-medium"
								>
									{t('onboarding.setAsProfile')}
								</button>
							</div>
						)}
					</div>
				))}

				{/* Bouton d'ajout */}
				{photos.length < maxPhotos && (
					<button
						type="button"
						onClick={() => fileInputRef.current?.click()}
						disabled={isUploading}
						className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2 text-text-muted hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isUploading ? (
							<div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
						) : (
							<>
								<svg
									className="w-8 h-8"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 4v16m8-8H4"
									/>
								</svg>
								<span className="text-sm">{t('onboarding.addPhoto')}</span>
							</>
						)}
					</button>
				)}
			</div>

			<p className="text-sm text-text-muted text-center">
				{photos.length} / {maxPhotos} photos
			</p>

			<input
				ref={fileInputRef}
				type="file"
				accept="image/jpeg,image/png,image/gif,image/webp"
				onChange={handleFileSelect}
				className="hidden"
			/>
		</div>
	);
}
