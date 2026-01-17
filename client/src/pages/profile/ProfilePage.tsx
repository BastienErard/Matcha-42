import { useState, useEffect } from 'react';
import { Layout } from '../../components/layout';
import { Button, Input, PhotoUploader } from '../../components/ui';
import { useTranslation } from '../../hooks/useTranslation';
import { translateTag } from '../../utils/tags';
import {
	getMyProfile,
	getMyPhotos,
	getTags,
	updateProfile,
	updateUserInfo,
	getVisitors,
	getLikers,
	getLikedProfiles,
	changePassword,
	getLocationSource,
	updateLocation,
	getLocationFromIp,
	type Photo,
	type Tag,
	type ProfilePreview,
} from '../../api';

interface ProfileData {
	id: number;
	username: string;
	first_name: string;
	last_name: string;
	email: string;
	gender: string | null;
	sexual_preference: string | null;
	biography: string | null;
	birth_date: string | null;
	city: string | null;
	country: string | null;
	fame_rating: number;
}

type TabType = 'profile' | 'activity';
type ActivitySubTab = 'visitors' | 'likers' | 'liked';

export function ProfilePage() {
	const { t } = useTranslation();

	// Onglets
	const [activeTab, setActiveTab] = useState<TabType>('profile');
	const [activitySubTab, setActivitySubTab] = useState<ActivitySubTab>('visitors');

	// Données profil
	const [profile, setProfile] = useState<ProfileData | null>(null);
	const [tags, setTags] = useState<string[]>([]);
	const [photos, setPhotos] = useState<Photo[]>([]);
	const [availableTags, setAvailableTags] = useState<Tag[]>([]);

	// Données activité
	const [visitors, setVisitors] = useState<ProfilePreview[]>([]);
	const [likers, setLikers] = useState<ProfilePreview[]>([]);
	const [liked, setLiked] = useState<ProfilePreview[]>([]);

	// États UI
	const [isLoading, setIsLoading] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	// Modal mot de passe
	const [showPasswordModal, setShowPasswordModal] = useState(false);

	// Localisation
	const [locationSource, setLocationSource] = useState<'gps' | 'ip' | 'manual' | null>(null);
	const [locationData, setLocationData] = useState<{ city: string; country: string } | null>(
		null
	);
	const [isEditingLocation, setIsEditingLocation] = useState(false);
	const [locationForm, setLocationForm] = useState({ city: '', country: '' });
	const [isSavingLocation, setIsSavingLocation] = useState(false);
	const [locationError, setLocationError] = useState('');
	const [locationSuccess, setLocationSuccess] = useState('');
	const currentLanguage = (localStorage.getItem('language') as 'fr' | 'en') || 'fr';

	// Formulaire profil
	const [formData, setFormData] = useState({
		firstName: '',
		lastName: '',
		email: '',
		birthDate: '',
		gender: '' as 'male' | 'female' | '',
		sexualPreference: '' as 'male' | 'female' | 'both' | '',
		biography: '',
		tags: [] as string[],
	});

	// Formulaire mot de passe
	const [passwordForm, setPasswordForm] = useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	});
	const [isChangingPassword, setIsChangingPassword] = useState(false);
	const [passwordError, setPasswordError] = useState('');
	const [passwordSuccess, setPasswordSuccess] = useState('');

	// Chargement initial
	useEffect(() => {
		async function loadProfile() {
			const [profileResult, photosResult, tagsResult, locationSourceResult] =
				await Promise.all([getMyProfile(), getMyPhotos(), getTags(), getLocationSource()]);

			if (profileResult.success && profileResult.data) {
				setProfile(profileResult.data.profile);
				setTags(profileResult.data.tags);

				// Récupère la ville/pays depuis le profil
				if (profileResult.data.profile.city || profileResult.data.profile.country) {
					setLocationData({
						city: profileResult.data.profile.city || '',
						country: profileResult.data.profile.country || '',
					});
				}
			}

			if (photosResult.success && photosResult.data) {
				setPhotos(photosResult.data.photos);
			}

			if (tagsResult.success && tagsResult.data) {
				setAvailableTags(tagsResult.data.tags);
			}

			if (locationSourceResult.success && locationSourceResult.data) {
				setLocationSource(locationSourceResult.data.source);
			}

			setIsLoading(false);
		}

		loadProfile();
	}, []);

	// Chargement activité
	useEffect(() => {
		if (activeTab === 'activity') {
			loadActivityData();
		}
	}, [activeTab]);

	async function loadActivityData() {
		const [visitorsResult, likersResult, likedResult] = await Promise.all([
			getVisitors(),
			getLikers(),
			getLikedProfiles(),
		]);

		if (visitorsResult.success && visitorsResult.data) {
			setVisitors(visitorsResult.data.visitors);
		}
		if (likersResult.success && likersResult.data) {
			setLikers(likersResult.data.likers);
		}
		if (likedResult.success && likedResult.data) {
			setLiked(likedResult.data.liked);
		}
	}

	function calculateAge(birthDate: string): number {
		const birth = new Date(birthDate);
		const today = new Date();
		let age = today.getFullYear() - birth.getFullYear();
		const monthDiff = today.getMonth() - birth.getMonth();
		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
			age--;
		}
		return age;
	}

	const profilePhoto = photos.find((p) => p.is_profile_picture) || photos[0];

	function getPhotoUrl(photo: Photo) {
		return `http://localhost:3000/uploads/${photo.filename}`;
	}

	function handleStartEdit() {
		if (!profile) return;

		setFormData({
			firstName: profile.first_name,
			lastName: profile.last_name,
			email: profile.email,
			birthDate: profile.birth_date ? profile.birth_date.split('T')[0] : '',
			gender: (profile.gender || '') as 'male' | 'female' | '',
			sexualPreference: (profile.sexual_preference || '') as 'male' | 'female' | 'both' | '',
			biography: profile.biography || '',
			tags: tags,
		});
		setError('');
		setSuccess('');
		setIsEditing(true);
	}

	function handleCancelEdit() {
		setIsEditing(false);
		setError('');
		setSuccess('');
	}

	function handleTabChange(tab: TabType) {
		if (isEditing) {
			handleCancelEdit();
		}
		if (isEditingLocation) {
			handleCancelEditLocation();
		}
		setActiveTab(tab);
	}

	function toggleTag(tagName: string) {
		setFormData((prev) => ({
			...prev,
			tags: prev.tags.includes(tagName)
				? prev.tags.filter((t) => t !== tagName)
				: [...prev.tags, tagName],
		}));
	}

	async function handleSave() {
		setError('');
		setSuccess('');

		// Validations
		if (!formData.firstName.trim() || !formData.lastName.trim()) {
			setError('MISSING_REQUIRED_FIELDS');
			return;
		}

		if (!formData.birthDate) {
			setError('MISSING_REQUIRED_FIELDS');
			return;
		}

		// Validation âge
		const birth = new Date(formData.birthDate);
		const today = new Date();
		const age = today.getFullYear() - birth.getFullYear();
		const monthDiff = today.getMonth() - birth.getMonth();
		if (age < 18 || (age === 18 && monthDiff < 0)) {
			setError('MUST_BE_ADULT');
			return;
		}

		if (!formData.biography.trim()) {
			setError('MISSING_REQUIRED_FIELDS');
			return;
		}

		if (formData.tags.length === 0) {
			setError('MISSING_REQUIRED_FIELDS');
			return;
		}

		if (!formData.gender || !formData.sexualPreference) {
			setError('MISSING_REQUIRED_FIELDS');
			return;
		}

		setIsSaving(true);

		// Met à jour les infos utilisateur si changées
		if (
			profile &&
			(formData.firstName !== profile.first_name ||
				formData.lastName !== profile.last_name ||
				formData.email !== profile.email)
		) {
			const userResult = await updateUserInfo({
				firstName: formData.firstName,
				lastName: formData.lastName,
				email: formData.email,
			});

			if (!userResult.success) {
				setError(userResult.error?.code || 'SERVER_ERROR');
				setIsSaving(false);
				return;
			}
		}

		// Met à jour le profil
		const profileResult = await updateProfile({
			gender: formData.gender as 'male' | 'female',
			sexualPreference: formData.sexualPreference as 'male' | 'female' | 'both',
			biography: formData.biography,
			birthDate: formData.birthDate,
			tags: formData.tags,
		});

		setIsSaving(false);

		if (profileResult.success) {
			setProfile((prev) =>
				prev
					? {
							...prev,
							first_name: formData.firstName,
							last_name: formData.lastName,
							email: formData.email,
							birth_date: formData.birthDate,
							gender: formData.gender,
							sexual_preference: formData.sexualPreference,
							biography: formData.biography,
						}
					: null
			);
			setTags(formData.tags);
			setIsEditing(false);
			setSuccess('PROFILE_UPDATED');
		} else {
			setError(profileResult.error?.code || 'SERVER_ERROR');
		}
	}

	function handleOpenPasswordModal() {
		setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
		setPasswordError('');
		setPasswordSuccess('');
		setShowPasswordModal(true);
	}

	function handleClosePasswordModal() {
		setShowPasswordModal(false);
		setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
		setPasswordError('');
		setPasswordSuccess('');
	}

	async function handleChangePassword() {
		setPasswordError('');
		setPasswordSuccess('');

		if (
			!passwordForm.currentPassword ||
			!passwordForm.newPassword ||
			!passwordForm.confirmPassword
		) {
			setPasswordError('MISSING_REQUIRED_FIELDS');
			return;
		}

		if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			setPasswordError('PASSWORDS_DONT_MATCH');
			return;
		}

		setIsChangingPassword(true);

		const result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);

		setIsChangingPassword(false);

		if (result.success) {
			setPasswordSuccess('PASSWORD_CHANGED');
			setTimeout(() => {
				handleClosePasswordModal();
			}, 1500);
		} else {
			setPasswordError(result.error?.code || 'SERVER_ERROR');
		}
	}

	// Fonctions de gestion de la localisation
	function handleStartEditLocation() {
		setLocationForm({
			city: locationData?.city || '',
			country: locationData?.country || '',
		});
		setLocationError('');
		setLocationSuccess('');
		setIsEditingLocation(true);
	}

	function handleCancelEditLocation() {
		setIsEditingLocation(false);
		setLocationError('');
	}

	async function handleSaveManualLocation() {
		setLocationError('');
		setLocationSuccess('');

		if (!locationForm.city.trim() || !locationForm.country.trim()) {
			setLocationError('CITY_AND_COUNTRY_REQUIRED');
			return;
		}

		setIsSavingLocation(true);

		// Récupère la langue actuelle (depuis localStorage ou défaut 'fr')
		const currentLanguage = (localStorage.getItem('language') as 'fr' | 'en') || 'fr';

		const result = await updateLocation({
			latitude: 0,
			longitude: 0,
			city: locationForm.city.trim(),
			country: locationForm.country.trim(),
			source: 'manual',
			language: currentLanguage,
		});

		setIsSavingLocation(false);

		if (result.success && result.data) {
			// Utilise les valeurs corrigées retournées par le backend
			setLocationData({
				city: result.data.location.city,
				country: result.data.location.country,
			});
			setLocationSource('manual');
			setIsEditingLocation(false);
			setLocationSuccess('LOCATION_UPDATED');
		} else {
			setLocationError(result.error?.code || 'SERVER_ERROR');
		}
	}

	async function handleResetToAutoLocation() {
		setLocationError('');
		setLocationSuccess('');
		setIsSavingLocation(true);

		try {
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(
					async (position) => {
						const result = await updateLocation({
							latitude: position.coords.latitude,
							longitude: position.coords.longitude,
							source: 'gps',
							language: currentLanguage,
						});

						if (result.success) {
							setLocationSource('gps');
							setLocationSuccess('LOCATION_AUTO_ENABLED');
							// Recharge le profil pour avoir la ville/pays mis à jour
							const profileResult = await getMyProfile();
							if (profileResult.success && profileResult.data) {
								setLocationData({
									city: profileResult.data.profile.city || '',
									country: profileResult.data.profile.country || '',
								});
							}
						}
						setIsSavingLocation(false);
					},
					async () => {
						// GPS refusé, utilise IP
						const ipResult = await getLocationFromIp(currentLanguage);

						if (ipResult.success && ipResult.data) {
							const result = await updateLocation({
								...ipResult.data.location,
								source: 'ip',
								language: currentLanguage,
							});

							if (result.success) {
								setLocationSource('ip');
								setLocationData({
									city: ipResult.data.location.city || '',
									country: ipResult.data.location.country || '',
								});
								setLocationSuccess('LOCATION_AUTO_ENABLED');
							}
						} else {
							setLocationError('LOCATION_ERROR');
						}
						setIsSavingLocation(false);
					},
					{ enableHighAccuracy: true, timeout: 10000 }
				);
			} else {
				// Géolocalisation non supportée
				const ipResult = await getLocationFromIp(currentLanguage);

				if (ipResult.success && ipResult.data) {
					const result = await updateLocation({
						...ipResult.data.location,
						source: 'ip',
						language: currentLanguage,
					});

					if (result.success) {
						setLocationSource('ip');
						setLocationData({
							city: ipResult.data.location.city || '',
							country: ipResult.data.location.country || '',
						});
						setLocationSuccess('LOCATION_AUTO_ENABLED');
					}
				} else {
					setLocationError('LOCATION_ERROR');
				}
				setIsSavingLocation(false);
			}
		} catch {
			setIsSavingLocation(false);
			setLocationError('LOCATION_ERROR');
		}
	}

	// Rendu loading
	if (isLoading) {
		return (
			<Layout variant="authenticated">
				<div className="flex-1 flex items-center justify-center">
					<div className="text-text-secondary">{t('common.loading')}</div>
				</div>
			</Layout>
		);
	}

	// Rendu erreur
	if (!profile) {
		return (
			<Layout variant="authenticated">
				<div className="flex-1 flex items-center justify-center">
					<div className="text-error">{t('errors.PROFILE_NOT_FOUND')}</div>
				</div>
			</Layout>
		);
	}

	return (
		<Layout variant="authenticated">
			<div className="max-w-4xl mx-auto px-4 py-8">
				{/* En-tête avec photo et infos principales */}
				<div className="bg-surface-elevated border border-border rounded-xl p-6 mb-6">
					<div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
						{/* Photo de profil */}
						<div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary flex-shrink-0">
							{profilePhoto ? (
								<img
									src={getPhotoUrl(profilePhoto)}
									alt={profile.username}
									className="w-full h-full object-cover"
								/>
							) : (
								<div className="w-full h-full bg-surface flex items-center justify-center text-text-muted">
									<svg
										className="w-10 h-10"
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
						</div>

						{/* Infos principales */}
						<div className="flex-1 text-center sm:text-left">
							<h1 className="text-2xl font-bold text-text-primary">
								{profile.first_name} {profile.last_name}
							</h1>
							<p className="text-text-secondary">@{profile.username}</p>

							<div className="flex flex-wrap gap-3 mt-2 justify-center sm:justify-start text-sm">
								{profile.birth_date && (
									<span className="text-text-secondary">
										{calculateAge(profile.birth_date)} {t('profile.years')}
									</span>
								)}
								{(locationData?.city || locationData?.country) && (
									<span className="text-text-secondary">
										📍 {locationData.city}
										{locationData.city && locationData.country ? ', ' : ''}
										{locationData.country}
									</span>
								)}
								<span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded-full">
									<span className="text-primary">🔥</span>
									<span className="text-primary font-medium">
										{profile.fame_rating}
									</span>
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Onglets */}
				<div className="flex border-b border-border mb-6">
					<button
						onClick={() => handleTabChange('profile')}
						className={`px-4 py-3 font-medium transition-colors ${
							activeTab === 'profile'
								? 'text-primary border-b-2 border-primary'
								: 'text-text-secondary hover:text-text-primary'
						}`}
					>
						{t('profile.tabs.profile')}
					</button>
					<button
						onClick={() => handleTabChange('activity')}
						className={`px-4 py-3 font-medium transition-colors ${
							activeTab === 'activity'
								? 'text-primary border-b-2 border-primary'
								: 'text-text-secondary hover:text-text-primary'
						}`}
					>
						{t('profile.tabs.activity')}
					</button>
				</div>

				{/* Messages */}
				{error && (
					<div className="p-4 rounded-lg bg-error/10 border border-error/20 text-error mb-6">
						{t(`errors.${error}`)}
					</div>
				)}
				{success && (
					<div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 mb-6">
						{t(`profile.${success === 'PROFILE_UPDATED' ? 'profileUpdated' : success}`)}
					</div>
				)}

				{/* Contenu onglet Profil */}
				{activeTab === 'profile' && (
					<div className="space-y-6">
						{/* Section Compte */}
						<div className="bg-surface-elevated border border-border rounded-xl p-6">
							<h2 className="text-lg font-semibold text-text-primary mb-4">
								{t('profile.account')}
							</h2>

							{isEditing ? (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<Input
										id="firstName"
										label={t('profile.firstName')}
										value={formData.firstName}
										onChange={(e) =>
											setFormData({ ...formData, firstName: e.target.value })
										}
									/>
									<Input
										id="lastName"
										label={t('profile.lastName')}
										value={formData.lastName}
										onChange={(e) =>
											setFormData({ ...formData, lastName: e.target.value })
										}
									/>
									<Input
										id="email"
										label={t('profile.email')}
										type="email"
										value={formData.email}
										onChange={(e) =>
											setFormData({ ...formData, email: e.target.value })
										}
									/>
									<Input
										id="birthDate"
										label={t('profile.birthDate')}
										type="date"
										value={formData.birthDate}
										onChange={(e) =>
											setFormData({ ...formData, birthDate: e.target.value })
										}
									/>
								</div>
							) : (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<span className="text-text-muted text-sm">
											{t('profile.firstName')}
										</span>
										<p className="text-text-primary">{profile.first_name}</p>
									</div>
									<div>
										<span className="text-text-muted text-sm">
											{t('profile.lastName')}
										</span>
										<p className="text-text-primary">{profile.last_name}</p>
									</div>
									<div>
										<span className="text-text-muted text-sm">
											{t('profile.email')}
										</span>
										<p className="text-text-primary">{profile.email}</p>
									</div>
									<div>
										<span className="text-text-muted text-sm">
											{t('profile.birthDate')}
										</span>
										<p className="text-text-primary">
											{profile.birth_date
												? new Date(profile.birth_date).toLocaleDateString()
												: '-'}
										</p>
									</div>
								</div>
							)}
						</div>

						{/* Section Localisation */}
						<div className="bg-surface-elevated border border-border rounded-xl p-6">
							<div className="flex justify-between items-start mb-4">
								<h2 className="text-lg font-semibold text-text-primary">
									{t('location.title')}
								</h2>
								{!isEditingLocation && !isEditing && (
									<Button
										variant="secondary"
										onClick={handleStartEditLocation}
										className="text-sm"
									>
										{t('location.manualEdit')}
									</Button>
								)}
							</div>

							{locationError && (
								<div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm mb-4">
									{t(`errors.${locationError}`)}
								</div>
							)}
							{locationSuccess && (
								<div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 text-sm mb-4">
									{t(
										`location.${locationSuccess === 'LOCATION_UPDATED' ? 'updated' : 'autoEnabled'}`
									)}
								</div>
							)}

							{isEditingLocation ? (
								<div className="space-y-4">
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<Input
											id="city"
											label={t('location.city')}
											value={locationForm.city}
											onChange={(e) =>
												setLocationForm({
													...locationForm,
													city: e.target.value,
												})
											}
											placeholder={t('location.cityPlaceholder')}
										/>
										<Input
											id="country"
											label={t('location.country')}
											value={locationForm.country}
											onChange={(e) =>
												setLocationForm({
													...locationForm,
													country: e.target.value,
												})
											}
											placeholder={t('location.countryPlaceholder')}
										/>
									</div>
									<div className="flex gap-3">
										<Button
											variant="secondary"
											onClick={handleCancelEditLocation}
											disabled={isSavingLocation}
										>
											{t('common.cancel')}
										</Button>
										<Button
											variant="primary"
											onClick={handleSaveManualLocation}
											isLoading={isSavingLocation}
										>
											{t('common.save')}
										</Button>
									</div>
								</div>
							) : (
								<div className="space-y-4">
									<div className="flex items-center gap-3">
										<span className="text-2xl">📍</span>
										<div>
											<p className="font-medium text-text-primary">
												{locationData?.city || locationData?.country
													? `${locationData.city}${locationData.city && locationData.country ? ', ' : ''}${locationData.country}`
													: t('location.notSet')}
											</p>
											<p className="text-sm text-text-muted">
												{locationSource === 'manual'
													? t('location.sourceManual')
													: locationSource
														? t('location.sourceAuto')
														: t('location.notSet')}
											</p>
										</div>
									</div>

									{locationSource === 'manual' && locationData?.city && (
										<button
											type="button"
											onClick={handleResetToAutoLocation}
											disabled={isSavingLocation}
											className="text-sm text-primary hover:underline disabled:opacity-50"
										>
											{isSavingLocation
												? t('common.loading')
												: t('location.resetToAuto')}
										</button>
									)}
								</div>
							)}
						</div>

						{/* Section À propos */}
						<div className="bg-surface-elevated border border-border rounded-xl p-6">
							<h2 className="text-lg font-semibold text-text-primary mb-4">
								{t('profile.about')}
							</h2>

							{isEditing ? (
								<textarea
									value={formData.biography}
									onChange={(e) =>
										setFormData({ ...formData, biography: e.target.value })
									}
									rows={4}
									className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
									placeholder={t('profile.bioPlaceholder')}
								/>
							) : (
								<p className="text-text-secondary whitespace-pre-line">
									{profile.biography || t('profile.noBio')}
								</p>
							)}
						</div>

						{/* Section Préférences */}
						<div className="bg-surface-elevated border border-border rounded-xl p-6">
							<h2 className="text-lg font-semibold text-text-primary mb-4">
								{t('profile.details')}
							</h2>

							{isEditing ? (
								<div className="space-y-4">
									<div className="space-y-2">
										<label className="block text-sm font-medium text-text-primary">
											{t('profile.gender')}
										</label>
										<div className="flex gap-3">
											{(['male', 'female'] as const).map((g) => (
												<button
													key={g}
													type="button"
													onClick={() =>
														setFormData({ ...formData, gender: g })
													}
													className={`flex-1 py-2.5 px-4 rounded-lg border font-medium text-sm ${
														formData.gender === g
															? 'border-primary bg-primary/10 text-primary'
															: 'border-border text-text-secondary hover:border-primary/50'
													}`}
												>
													{t(
														`profile.gender${g.charAt(0).toUpperCase() + g.slice(1)}`
													)}
												</button>
											))}
										</div>
									</div>

									<div className="space-y-2">
										<label className="block text-sm font-medium text-text-primary">
											{t('profile.lookingFor')}
										</label>
										<div className="flex gap-3">
											{(['male', 'female', 'both'] as const).map((pref) => (
												<button
													key={pref}
													type="button"
													onClick={() =>
														setFormData({
															...formData,
															sexualPreference: pref,
														})
													}
													className={`flex-1 py-2.5 px-4 rounded-lg border font-medium text-sm ${
														formData.sexualPreference === pref
															? 'border-primary bg-primary/10 text-primary'
															: 'border-border text-text-secondary hover:border-primary/50'
													}`}
												>
													{t(
														`profile.pref${pref.charAt(0).toUpperCase() + pref.slice(1)}`
													)}
												</button>
											))}
										</div>
									</div>
								</div>
							) : (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<span className="text-text-muted text-sm">
											{t('profile.gender')}
										</span>
										<p className="text-text-primary">
											{profile.gender
												? t(
														`profile.gender${profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}`
													)
												: '-'}
										</p>
									</div>
									<div>
										<span className="text-text-muted text-sm">
											{t('profile.lookingFor')}
										</span>
										<p className="text-text-primary">
											{profile.sexual_preference
												? t(
														`profile.pref${profile.sexual_preference.charAt(0).toUpperCase() + profile.sexual_preference.slice(1)}`
													)
												: '-'}
										</p>
									</div>
								</div>
							)}
						</div>

						{/* Section Intérêts */}
						<div className="bg-surface-elevated border border-border rounded-xl p-6">
							<h2 className="text-lg font-semibold text-text-primary mb-4">
								{t('profile.interests')}
							</h2>

							{isEditing ? (
								<div className="flex flex-wrap gap-2">
									{availableTags.map((tag) => (
										<button
											key={tag.id}
											type="button"
											onClick={() => toggleTag(tag.name)}
											className={`px-3 py-1.5 rounded-full border font-medium text-sm ${
												formData.tags.includes(tag.name)
													? 'border-primary bg-primary/10 text-primary'
													: 'border-border text-text-secondary hover:border-primary/50'
											}`}
										>
											#{translateTag(tag.name, t)}
										</button>
									))}
								</div>
							) : tags.length > 0 ? (
								<div className="flex flex-wrap gap-2">
									{tags.map((tag) => (
										<span
											key={tag}
											className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
										>
											#{translateTag(tag, t)}
										</span>
									))}
								</div>
							) : (
								<p className="text-text-muted">{t('profile.noInterests')}</p>
							)}
						</div>

						{/* Section Photos */}
						<div className="bg-surface-elevated border border-border rounded-xl p-6">
							<h2 className="text-lg font-semibold text-text-primary mb-4">
								{t('profile.photos')}
							</h2>

							{isEditing ? (
								<PhotoUploader
									photos={photos}
									onPhotosChange={setPhotos}
									maxPhotos={5}
								/>
							) : photos.length > 0 ? (
								<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
									{photos.map((photo) => (
										<div
											key={photo.id}
											className="aspect-square rounded-lg overflow-hidden border border-border"
										>
											<img
												src={getPhotoUrl(photo)}
												alt=""
												className="w-full h-full object-cover"
											/>
										</div>
									))}
								</div>
							) : (
								<p className="text-text-muted">{t('profile.noPhotos')}</p>
							)}
						</div>

						{/* Boutons d'action en bas */}
						<div className="flex justify-end gap-3 pt-4">
							{isEditing ? (
								<>
									<Button
										variant="secondary"
										onClick={handleCancelEdit}
										disabled={isSaving}
									>
										{t('common.cancel')}
									</Button>
									<Button
										variant="primary"
										onClick={handleSave}
										isLoading={isSaving}
									>
										{t('common.save')}
									</Button>
								</>
							) : (
								<>
									<Button variant="secondary" onClick={handleOpenPasswordModal}>
										{t('profile.changePassword')}
									</Button>
									<Button variant="primary" onClick={handleStartEdit}>
										{t('profile.edit')}
									</Button>
								</>
							)}
						</div>
					</div>
				)}

				{/* Contenu onglet Activité */}
				{activeTab === 'activity' && (
					<div className="space-y-6">
						{/* Sous-onglets */}
						<div className="flex gap-2">
							{(['visitors', 'likers', 'liked'] as const).map((tab) => (
								<button
									key={tab}
									onClick={() => setActivitySubTab(tab)}
									className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
										activitySubTab === tab
											? 'bg-primary text-text-inverse'
											: 'bg-surface-elevated text-text-secondary hover:text-text-primary border border-border'
									}`}
								>
									{t(`profile.${tab}`)}
								</button>
							))}
						</div>

						{/* Liste des profils */}
						<div className="bg-surface-elevated border border-border rounded-xl">
							{activitySubTab === 'visitors' &&
								(visitors.length > 0 ? (
									<ProfileList profiles={visitors} t={t} />
								) : (
									<p className="p-6 text-text-muted text-center">
										{t('profile.noVisitors')}
									</p>
								))}

							{activitySubTab === 'likers' &&
								(likers.length > 0 ? (
									<ProfileList profiles={likers} t={t} />
								) : (
									<p className="p-6 text-text-muted text-center">
										{t('profile.noLikers')}
									</p>
								))}

							{activitySubTab === 'liked' &&
								(liked.length > 0 ? (
									<ProfileList profiles={liked} t={t} />
								) : (
									<p className="p-6 text-text-muted text-center">
										{t('profile.noLiked')}
									</p>
								))}
						</div>
					</div>
				)}
			</div>

			{/* Modal mot de passe */}
			{showPasswordModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center">
					{/* Overlay */}
					<div
						className="absolute inset-0 bg-black/50"
						onClick={handleClosePasswordModal}
					/>

					{/* Modal */}
					<div className="relative bg-surface-elevated border border-border rounded-xl p-6 w-full max-w-md mx-4 space-y-4">
						<h2 className="text-lg font-semibold text-text-primary">
							{t('profile.changePassword')}
						</h2>

						{passwordError && (
							<div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
								{t(`errors.${passwordError}`)}
							</div>
						)}
						{passwordSuccess && (
							<div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 text-sm">
								{t('profile.passwordChanged')}
							</div>
						)}

						<div className="space-y-4">
							<Input
								id="currentPassword"
								label={t('profile.currentPassword')}
								type="password"
								value={passwordForm.currentPassword}
								onChange={(e) =>
									setPasswordForm({
										...passwordForm,
										currentPassword: e.target.value,
									})
								}
							/>
							<Input
								id="newPassword"
								label={t('profile.newPassword')}
								type="password"
								value={passwordForm.newPassword}
								onChange={(e) =>
									setPasswordForm({
										...passwordForm,
										newPassword: e.target.value,
									})
								}
							/>
							<Input
								id="confirmPassword"
								label={t('profile.confirmPassword')}
								type="password"
								value={passwordForm.confirmPassword}
								onChange={(e) =>
									setPasswordForm({
										...passwordForm,
										confirmPassword: e.target.value,
									})
								}
							/>
						</div>

						<div className="flex justify-end gap-3 pt-2">
							<Button
								variant="secondary"
								onClick={handleClosePasswordModal}
								disabled={isChangingPassword}
							>
								{t('common.cancel')}
							</Button>
							<Button
								variant="primary"
								onClick={handleChangePassword}
								isLoading={isChangingPassword}
							>
								{t('common.save')}
							</Button>
						</div>
					</div>
				</div>
			)}
		</Layout>
	);
}

// Composant pour afficher une liste de profils
function ProfileList({ profiles, t }: { profiles: ProfilePreview[]; t: (key: string) => string }) {
	return (
		<ul className="divide-y divide-border">
			{profiles.map((profile) => (
				<li
					key={profile.id}
					className="p-4 flex items-center justify-between hover:bg-surface transition-colors"
				>
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-text-muted">
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
						<div>
							<p className="font-medium text-text-primary">
								{profile.first_name} {profile.last_name}
							</p>
							<p className="text-sm text-text-muted">@{profile.username}</p>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<span className="text-sm text-text-muted flex items-center gap-1">
							🔥 {profile.fame_rating}
						</span>

						<a
							href={`/user/${profile.id}`}
							className="text-primary hover:underline text-sm font-medium"
						>
							{t('profile.viewProfile')}
						</a>
					</div>
				</li>
			))}
		</ul>
	);
}
