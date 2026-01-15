import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout';
import { Button, Input, PhotoUploader } from '../../components/ui';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuth } from '../../hooks/useAuth';
import {
	updateProfile,
	getTags,
	getMyProfile,
	completeOnboarding,
	getMyPhotos,
	type Tag,
	type Photo,
} from '../../api';

const TOTAL_STEPS = 4;

export function OnboardingPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { refreshProfile, hasCompletedOnboarding } = useAuth();

	const [currentStep, setCurrentStep] = useState(1);
	const [isLoading, setIsLoading] = useState(false);
	const [isInitialLoading, setIsInitialLoading] = useState(true);
	const [error, setError] = useState('');

	// Photos
	const [photos, setPhotos] = useState<Photo[]>([]);

	// Tags disponibles depuis l'API
	const [availableTags, setAvailableTags] = useState<Tag[]>([]);
	const [tagsLoading, setTagsLoading] = useState(true);

	// Données du formulaire
	const [formData, setFormData] = useState({
		gender: '' as 'male' | 'female' | '',
		sexualPreference: '' as 'male' | 'female' | 'both' | '',
		birthDate: '',
		biography: '',
		tags: [] as string[],
	});

	// Charger les données existantes et déterminer l'étape
	useEffect(() => {
		async function loadExistingData() {
			if (hasCompletedOnboarding) {
				navigate('/discover', { replace: true });
				return;
			}

			const [profileResult, photosResult] = await Promise.all([
				getMyProfile(),
				getMyPhotos(),
			]);

			if (profileResult.success && profileResult.data) {
				const { profile, tags } = profileResult.data;

				const existingData = {
					gender: (profile.gender || '') as 'male' | 'female' | '',
					sexualPreference: (profile.sexual_preference || '') as
						| 'male'
						| 'female'
						| 'both'
						| '',
					birthDate: profile.birth_date ? profile.birth_date.split('T')[0] : '',
					biography: profile.biography || '',
					tags: tags,
				};

				setFormData(existingData);

				if (photosResult.success && photosResult.data) {
					setPhotos(photosResult.data.photos);
				}

				if (
					!existingData.gender ||
					!existingData.sexualPreference ||
					!existingData.birthDate
				) {
					setCurrentStep(1);
				} else if (!existingData.biography) {
					setCurrentStep(2);
				} else if (existingData.tags.length === 0) {
					setCurrentStep(3);
				} else {
					setCurrentStep(4);
				}
			}

			setIsInitialLoading(false);
		}

		loadExistingData();
	}, [hasCompletedOnboarding, navigate]);

	// Charger les tags au montage
	useEffect(() => {
		async function loadTags() {
			const result = await getTags();
			if (result.success && result.data) {
				setAvailableTags(result.data.tags);
			}
			setTagsLoading(false);
		}
		loadTags();
	}, []);

	function toggleTag(tagName: string) {
		setFormData((prev) => ({
			...prev,
			tags: prev.tags.includes(tagName)
				? prev.tags.filter((t) => t !== tagName)
				: [...prev.tags, tagName],
		}));
	}

	async function saveCurrentStep() {
		setIsLoading(true);
		setError('');

		const dataToSave: Parameters<typeof updateProfile>[0] = {};

		if (currentStep === 1) {
			dataToSave.gender = formData.gender as 'male' | 'female';
			dataToSave.sexualPreference = formData.sexualPreference as 'male' | 'female' | 'both';
			dataToSave.birthDate = formData.birthDate;
		} else if (currentStep === 2) {
			dataToSave.biography = formData.biography;
		} else if (currentStep === 3) {
			dataToSave.tags = formData.tags;
		}

		const result = await updateProfile(dataToSave);
		setIsLoading(false);

		if (!result.success) {
			setError(result.error?.code || 'SERVER_ERROR');
			return false;
		}
		return true;
	}

	async function handleNext() {
		setError('');

		// Validation par étape
		if (currentStep === 1) {
			if (!formData.gender || !formData.sexualPreference || !formData.birthDate) {
				setError('MISSING_REQUIRED_FIELDS');
				return;
			}
			const birth = new Date(formData.birthDate);
			const today = new Date();
			const age = today.getFullYear() - birth.getFullYear();
			const monthDiff = today.getMonth() - birth.getMonth();
			if (age < 18 || (age === 18 && monthDiff < 0)) {
				setError('MUST_BE_ADULT');
				return;
			}
		}

		if (currentStep === 2) {
			if (!formData.biography.trim()) {
				setError('MISSING_REQUIRED_FIELDS');
				return;
			}
		}

		if (currentStep === 3) {
			if (formData.tags.length === 0) {
				setError('MISSING_REQUIRED_FIELDS');
				return;
			}
		}

		if (currentStep === 4) {
			const hasProfilePic = photos.some((p) => p.is_profile_picture);
			if (!hasProfilePic) {
				setError('PROFILE_PICTURE_REQUIRED');
				return;
			}
		}

		// Sauvegarde l'étape actuelle (sauf étape 4, les photos sont déjà sauvées)
		if (currentStep < 4) {
			const saved = await saveCurrentStep();
			if (!saved) return;
		}

		if (currentStep < TOTAL_STEPS) {
			setCurrentStep(currentStep + 1);
		} else {
			// Étape 4 terminée → marquer l'onboarding comme complet
			setIsLoading(true);
			const completeResult = await completeOnboarding();
			setIsLoading(false);

			if (completeResult.success) {
				await refreshProfile();
				navigate('/discover');
			} else {
				setError(completeResult.error?.code || 'SERVER_ERROR');
			}
		}
	}

	function handleBack() {
		if (currentStep > 1) {
			setCurrentStep(currentStep - 1);
			setError('');
		}
	}

	if (isInitialLoading) {
		return (
			<Layout variant="onboarding">
				<div className="flex-1 flex items-center justify-center">
					<div className="text-text-secondary">{t('common.loading')}</div>
				</div>
			</Layout>
		);
	}

	return (
		<Layout variant="onboarding">
			<div className="flex-1 flex items-center justify-center px-4 py-12">
				<div className="w-full max-w-lg space-y-8">
					{/* En-tête avec progression */}
					<div className="text-center space-y-2">
						<h1 className="text-3xl font-bold text-text-primary">
							{t('onboarding.title')}
						</h1>
						<p className="text-text-secondary">
							{t('onboarding.step', { current: currentStep, total: TOTAL_STEPS })}
						</p>
						<div className="flex gap-2 justify-center mt-4">
							{Array.from({ length: TOTAL_STEPS }).map((_, i) => (
								<div
									key={i}
									className={`h-2 w-16 rounded-full ${
										i + 1 <= currentStep ? 'bg-primary' : 'bg-border'
									}`}
								/>
							))}
						</div>
					</div>

					{/* Contenu de l'étape */}
					<div className="bg-surface-elevated border border-border rounded-xl p-8 space-y-6">
						{error && (
							<div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
								{t(`errors.${error}`)}
							</div>
						)}

						{/* Étape 1 : Genre, Préférence, Date de naissance */}
						{currentStep === 1 && (
							<div className="space-y-6">
								<h2 className="text-xl font-semibold text-text-primary">
									{t('onboarding.step1Title')}
								</h2>

								<div className="space-y-2">
									<label className="block text-sm font-medium text-text-primary">
										{t('onboarding.gender')}
									</label>
									<div className="flex gap-4">
										<button
											type="button"
											onClick={() =>
												setFormData({ ...formData, gender: 'male' })
											}
											className={`flex-1 py-3 px-4 rounded-lg border font-medium ${
												formData.gender === 'male'
													? 'border-primary bg-primary/10 text-primary'
													: 'border-border text-text-secondary hover:border-primary/50'
											}`}
										>
											{t('onboarding.genderMale')}
										</button>
										<button
											type="button"
											onClick={() =>
												setFormData({ ...formData, gender: 'female' })
											}
											className={`flex-1 py-3 px-4 rounded-lg border font-medium ${
												formData.gender === 'female'
													? 'border-primary bg-primary/10 text-primary'
													: 'border-border text-text-secondary hover:border-primary/50'
											}`}
										>
											{t('onboarding.genderFemale')}
										</button>
									</div>
								</div>

								<div className="space-y-2">
									<label className="block text-sm font-medium text-text-primary">
										{t('onboarding.sexualPreference')}
									</label>
									<div className="flex gap-4">
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
												className={`flex-1 py-3 px-4 rounded-lg border font-medium ${
													formData.sexualPreference === pref
														? 'border-primary bg-primary/10 text-primary'
														: 'border-border text-text-secondary hover:border-primary/50'
												}`}
											>
												{t(
													`onboarding.pref${pref.charAt(0).toUpperCase() + pref.slice(1)}`
												)}
											</button>
										))}
									</div>
								</div>

								<Input
									id="birthDate"
									label={t('onboarding.birthDate')}
									type="date"
									value={formData.birthDate}
									onChange={(e) =>
										setFormData({ ...formData, birthDate: e.target.value })
									}
								/>
							</div>
						)}

						{/* Étape 2 : Biographie */}
						{currentStep === 2 && (
							<div className="space-y-6">
								<h2 className="text-xl font-semibold text-text-primary">
									{t('onboarding.step2Title')}
								</h2>

								<div className="space-y-2">
									<label className="block text-sm font-medium text-text-primary">
										{t('onboarding.biography')}
									</label>
									<textarea
										value={formData.biography}
										onChange={(e) =>
											setFormData({ ...formData, biography: e.target.value })
										}
										placeholder={t('onboarding.biographyPlaceholder')}
										rows={5}
										className="w-full px-4 py-3 rounded-lg border border-border bg-surface-elevated text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
									/>
								</div>
							</div>
						)}

						{/* Étape 3 : Tags prédéfinis */}
						{currentStep === 3 && (
							<div className="space-y-6">
								<h2 className="text-xl font-semibold text-text-primary">
									{t('onboarding.step3Title')}
								</h2>

								{tagsLoading ? (
									<p className="text-text-muted text-center py-4">
										{t('common.loading')}
									</p>
								) : (
									<div className="space-y-3">
										<div className="flex flex-wrap gap-2">
											{availableTags.map((tag) => (
												<button
													key={tag.id}
													type="button"
													onClick={() => toggleTag(tag.name)}
													className={`px-4 py-2 rounded-full border font-medium text-sm ${
														formData.tags.includes(tag.name)
															? 'border-primary bg-primary/10 text-primary'
															: 'border-border text-text-secondary hover:border-primary/50'
													}`}
												>
													#{tag.name}
												</button>
											))}
										</div>
										{formData.tags.length > 0 && (
											<p className="text-sm text-text-muted">
												{formData.tags.length} tag
												{formData.tags.length > 1 ? 's' : ''} sélectionné
												{formData.tags.length > 1 ? 's' : ''}
											</p>
										)}
									</div>
								)}
							</div>
						)}

						{/* Étape 4 : Photos */}
						{currentStep === 4 && (
							<div className="space-y-6">
								<h2 className="text-xl font-semibold text-text-primary">
									{t('onboarding.step4Title')}
								</h2>
								<p className="text-text-secondary">{t('onboarding.photosHelp')}</p>
								<PhotoUploader
									photos={photos}
									onPhotosChange={setPhotos}
									maxPhotos={5}
								/>
							</div>
						)}

						{/* Boutons navigation */}
						<div className="flex gap-4 pt-4">
							{currentStep > 1 && (
								<Button
									type="button"
									variant="secondary"
									size="lg"
									onClick={handleBack}
									disabled={isLoading}
									className="flex-1"
								>
									{t('common.back')}
								</Button>
							)}
							<Button
								type="button"
								variant="primary"
								size="lg"
								onClick={handleNext}
								isLoading={isLoading}
								className="flex-1"
							>
								{currentStep === TOTAL_STEPS
									? t('onboarding.finish')
									: t('onboarding.continue')}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</Layout>
	);
}
