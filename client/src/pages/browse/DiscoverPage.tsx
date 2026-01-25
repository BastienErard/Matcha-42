import { useState, useEffect } from 'react';
import { Layout } from '../../components/layout';
import { useTranslation } from '../../hooks/useTranslation';
import { translateTag } from '../../utils/tags';
import { UserProfileModal, ProfileMap } from '../../components/common';
import { useSocket } from '../../hooks/useSocket';
import {
	getSuggestions,
	getTags,
	type BrowseProfile,
	type BrowseFilters,
	type BrowseSort,
	type Tag,
} from '../../api';

export function DiscoverPage() {
	const { t } = useTranslation();

	// Mode d'affichage
	const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

	// Position utilisateur (pour centrer la carte)
	const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

	// Données
	const [profiles, setProfiles] = useState<BrowseProfile[]>([]);
	const [availableTags, setAvailableTags] = useState<Tag[]>([]);
	const [total, setTotal] = useState(0);

	// Pagination
	const [offset, setOffset] = useState(0);
	const limit = 20;

	// Filtres
	const [filters, setFilters] = useState<BrowseFilters>({});
	const [sort, setSort] = useState<BrowseSort>({ sortBy: 'distance', order: 'asc' });

	// UI
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState('');
	const [showFilters, setShowFilters] = useState(false);

	// Modal
	const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

	// Formulaire filtres temporaire (avant validation)
	const [filterForm, setFilterForm] = useState<BrowseFilters>({});

	// Chargement initial
	useEffect(() => {
		loadTags();
	}, []);

	// Chargement des profils quand filtres/tri/pagination changent
	useEffect(() => {
		loadProfiles();
	}, [filters, sort, offset, viewMode]);

	// Récupère la position de l'utilisateur
	useEffect(() => {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					setUserLocation({
						lat: position.coords.latitude,
						lng: position.coords.longitude,
					});
				},
				(error) => {
					console.log('Géolocalisation non disponible:', error.message);
				}
			);
		}
	}, []);

	// Socket.io pour le statut en ligne temps réel
	useSocket({
		onOnlineStatus: (status) => {
			// Met à jour le statut dans la liste des profils
			setProfiles((prev) =>
				prev.map((profile) =>
					profile.id === status.userId
						? { ...profile, isOnline: status.isOnline }
						: profile
				)
			);
		},
	});

	async function loadTags() {
		const result = await getTags();
		if (result.success && result.data) {
			setAvailableTags(result.data.tags);
		}
	}

	async function loadProfiles() {
		setIsLoading(true);
		setError('');

		const requestLimit = viewMode === 'map' ? 500 : limit;
		const requestOffset = viewMode === 'map' ? 0 : offset;

		const requestSort =
			viewMode === 'map' ? { sortBy: 'distance' as const, order: 'asc' as const } : sort;

		const result = await getSuggestions(filters, requestSort, requestLimit, requestOffset);

		if (result.success && result.data) {
			setProfiles(result.data.profiles);
			setTotal(result.data.total);
		} else {
			setError(result.error?.code || 'SERVER_ERROR');
		}

		setIsLoading(false);
	}

	function getPhotoUrl(filename: string | null): string | null {
		if (!filename) return null;
		if (filename.startsWith('http://') || filename.startsWith('https://')) {
			return filename;
		}
		return `http://localhost:3000/uploads/${filename}`;
	}

	function formatDistance(distance: number | null): string {
		if (distance === null) return '';
		if (distance < 1) return t('discover.lessThan1km');
		return `${Math.round(distance)} km`;
	}

	function handleOpenFilters() {
		setFilterForm({ ...filters });
		setShowFilters(true);
	}

	function handleApplyFilters() {
		setFilters({ ...filterForm });
		setOffset(0); // Reset pagination
		setShowFilters(false);
	}

	function handleResetFilters() {
		setFilterForm({});
		setFilters({});
		setOffset(0);
		setShowFilters(false);
	}

	function toggleFilterTag(tagName: string) {
		setFilterForm((prev) => ({
			...prev,
			tags: prev.tags?.includes(tagName)
				? prev.tags.filter((t) => t !== tagName)
				: [...(prev.tags || []), tagName],
		}));
	}

	function handleSortChange(newSortBy: BrowseSort['sortBy']) {
		if (sort.sortBy === newSortBy) {
			// Toggle order
			setSort({ sortBy: newSortBy, order: sort.order === 'asc' ? 'desc' : 'asc' });
		} else {
			// Nouveau critère, ordre par défaut
			const defaultOrder = newSortBy === 'fame' || newSortBy === 'tags' ? 'desc' : 'asc';
			setSort({ sortBy: newSortBy, order: defaultOrder });
		}
		setOffset(0);
	}

	const totalPages = Math.ceil(total / limit);
	const currentPage = Math.floor(offset / limit) + 1;

	return (
		<Layout variant="authenticated">
			<div className="max-w-6xl mx-auto px-4 py-6">
				{/* Header */}
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
					<div>
						<h1 className="text-2xl font-bold text-text-primary">
							{t('discover.title')}
						</h1>
						<p className="text-text-muted">
							{total} {t('discover.profilesFound')}
						</p>
					</div>

					<button
						onClick={handleOpenFilters}
						className="inline-flex items-center gap-2 px-4 py-2 bg-surface-elevated border border-border rounded-xl text-text-primary hover:bg-surface transition-colors"
					>
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
								d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
							/>
						</svg>
						{t('discover.filters')}
						{Object.keys(filters).length > 0 && (
							<span className="w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center">
								{
									Object.keys(filters).filter((k) => {
										const value = filters[k as keyof BrowseFilters];
										return (
											value !== undefined &&
											(!Array.isArray(value) || value.length > 0)
										);
									}).length
								}
							</span>
						)}
					</button>
				</div>

				{/* Tri + Toggle Vue */}
				<div className="flex flex-wrap items-center justify-between gap-4 mb-6">
					{/* Options de tri (uniquement en mode liste) */}
					{viewMode === 'list' && (
						<div className="flex flex-wrap gap-2">
							{(['distance', 'age', 'fame', 'tags'] as const).map((sortOption) => (
								<button
									key={sortOption}
									onClick={() => handleSortChange(sortOption)}
									className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
										sort.sortBy === sortOption
											? 'bg-primary text-white'
											: 'bg-surface-elevated border border-border text-text-secondary hover:text-text-primary'
									}`}
								>
									{t(`discover.sortBy.${sortOption}`)}
									{sort.sortBy === sortOption && (
										<span className="ml-1">
											{sort.order === 'asc' ? '↑' : '↓'}
										</span>
									)}
								</button>
							))}
						</div>
					)}

					{/* Toggle Liste / Carte */}
					<div className="flex rounded-xl border border-border overflow-hidden">
						<button
							onClick={() => setViewMode('list')}
							className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
								viewMode === 'list'
									? 'bg-primary text-white'
									: 'bg-surface-elevated text-text-secondary hover:text-text-primary'
							}`}
						>
							<svg
								className="w-4 h-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M4 6h16M4 10h16M4 14h16M4 18h16"
								/>
							</svg>
							{t('discover.listView')}
						</button>
						<button
							onClick={() => setViewMode('map')}
							className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
								viewMode === 'map'
									? 'bg-primary text-white'
									: 'bg-surface-elevated text-text-secondary hover:text-text-primary'
							}`}
						>
							<svg
								className="w-4 h-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
								/>
							</svg>
							{t('discover.mapView')}
						</button>
					</div>
				</div>

				{/* Contenu */}
				{isLoading ? (
					<div className="flex items-center justify-center py-20">
						<div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
					</div>
				) : error ? (
					<div className="text-center py-20">
						<p className="text-error mb-4">{t(`errors.${error}`)}</p>
						<button onClick={loadProfiles} className="text-primary hover:underline">
							{t('common.retry')}
						</button>
					</div>
				) : profiles.length === 0 ? (
					<div className="text-center py-20">
						<p className="text-text-muted text-lg">{t('discover.noProfiles')}</p>
						{Object.keys(filters).length > 0 && (
							<button
								onClick={handleResetFilters}
								className="mt-4 text-primary hover:underline"
							>
								{t('discover.resetFilters')}
							</button>
						)}
					</div>
				) : viewMode === 'map' ? (
					/* Vue Carte */
					<ProfileMap
						profiles={profiles}
						userLocation={userLocation}
						onProfileClick={(id) => setSelectedUserId(id)}
					/>
				) : (
					/* Vue Liste */
					<>
						{/* Grille de profils */}
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
							{profiles.map((profile) => {
								const photoUrl = getPhotoUrl(profile.profilePhoto);

								return (
									<div
										key={profile.id}
										onClick={() => setSelectedUserId(profile.id)}
										className="bg-surface-elevated border border-border rounded-2xl overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group"
									>
										{/* Photo */}
										<div className="relative aspect-[3/4] bg-surface">
											{photoUrl ? (
												<img
													src={photoUrl}
													alt={profile.username}
													className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
												/>
											) : (
												<div className="w-full h-full flex items-center justify-center text-text-muted">
													<svg
														className="w-16 h-16"
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

											{/* Badge en ligne */}
											{profile.isOnline && (
												<div className="absolute top-3 right-3 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
											)}

											{/* Overlay gradient */}
											<div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />

											{/* Infos sur la photo */}
											<div className="absolute bottom-3 left-3 right-3 text-white">
												<h3 className="font-bold text-lg">
													{profile.firstName}
													{profile.age && `, ${profile.age}`}
												</h3>
												{profile.city && (
													<p className="text-sm text-white/80">
														📍 {profile.city}
														{profile.distance !== null &&
															` • ${formatDistance(profile.distance)}`}
													</p>
												)}
											</div>
										</div>

										{/* Footer card */}
										<div className="p-3">
											<div className="flex items-center justify-between text-sm">
												<span className="text-text-muted flex items-center gap-1">
													🔥 {profile.fameRating}
												</span>
												{profile.commonTagsCount > 0 && (
													<span className="text-primary font-medium">
														{profile.commonTagsCount}{' '}
														{t('discover.commonTags')}
													</span>
												)}
											</div>

											{/* Tags preview */}
											{profile.tags.length > 0 && (
												<div className="flex flex-wrap gap-1 mt-2">
													{profile.tags.slice(0, 3).map((tag) => (
														<span
															key={tag}
															className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs"
														>
															#{translateTag(tag, t)}
														</span>
													))}
													{profile.tags.length > 3 && (
														<span className="text-xs text-text-muted">
															+{profile.tags.length - 3}
														</span>
													)}
												</div>
											)}
										</div>
									</div>
								);
							})}
						</div>

						{/* Pagination */}
						{totalPages > 1 && (
							<div className="flex items-center justify-center gap-4 mt-8">
								<button
									onClick={() => setOffset(Math.max(0, offset - limit))}
									disabled={offset === 0}
									className="px-4 py-2 rounded-xl border border-border text-text-secondary hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								>
									{t('common.previous')}
								</button>

								<span className="text-text-muted">
									{currentPage} / {totalPages}
								</span>

								<button
									onClick={() => setOffset(offset + limit)}
									disabled={currentPage >= totalPages}
									className="px-4 py-2 rounded-xl border border-border text-text-secondary hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								>
									{t('common.next')}
								</button>
							</div>
						)}
					</>
				)}
			</div>

			{/* Modal Filtres */}
			{showFilters && (
				<div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center">
					<div
						className="absolute inset-0 bg-black/60 backdrop-blur-sm"
						onClick={() => setShowFilters(false)}
					/>

					<div className="relative w-full sm:max-w-md bg-surface-elevated sm:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-hidden flex flex-col">
						{/* Header */}
						<div className="flex items-center justify-between p-4 border-b border-border">
							<h2 className="text-lg font-semibold text-text-primary">
								{t('discover.filters')}
							</h2>
							<button
								onClick={() => setShowFilters(false)}
								className="w-8 h-8 rounded-full hover:bg-surface flex items-center justify-center text-text-muted"
							>
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
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>

						{/* Contenu filtres */}
						<div className="flex-1 overflow-y-auto p-4 space-y-6">
							{/* Âge */}
							<div>
								<label className="block text-sm font-medium text-text-primary mb-3">
									{t('discover.ageRange')}
								</label>
								<div className="flex items-center gap-3">
									<input
										type="number"
										min={18}
										max={99}
										placeholder="18"
										value={filterForm.minAge || ''}
										onChange={(e) =>
											setFilterForm({
												...filterForm,
												minAge: e.target.value
													? parseInt(e.target.value, 10)
													: undefined,
											})
										}
										className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-center"
									/>
									<span className="text-text-muted">—</span>
									<input
										type="number"
										min={18}
										max={99}
										placeholder="99"
										value={filterForm.maxAge || ''}
										onChange={(e) =>
											setFilterForm({
												...filterForm,
												maxAge: e.target.value
													? parseInt(e.target.value, 10)
													: undefined,
											})
										}
										className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-center"
									/>
								</div>
							</div>

							{/* Distance */}
							<div>
								<label className="block text-sm font-medium text-text-primary mb-3">
									{t('discover.maxDistance')}
								</label>
								<div className="flex items-center gap-3">
									<input
										type="number"
										min={1}
										placeholder={t('discover.noLimit')}
										value={filterForm.maxDistance || ''}
										onChange={(e) =>
											setFilterForm({
												...filterForm,
												maxDistance: e.target.value
													? parseInt(e.target.value, 10)
													: undefined,
											})
										}
										className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-text-primary"
									/>
									<span className="text-text-muted">km</span>
								</div>
							</div>

							{/* Fame rating */}
							<div>
								<label className="block text-sm font-medium text-text-primary mb-3">
									{t('discover.fameRange')}
								</label>
								<div className="flex items-center gap-3">
									<input
										type="number"
										min={0}
										max={100}
										placeholder="0"
										value={filterForm.minFame ?? ''}
										onChange={(e) =>
											setFilterForm({
												...filterForm,
												minFame: e.target.value
													? parseInt(e.target.value, 10)
													: undefined,
											})
										}
										className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-center"
									/>
									<span className="text-text-muted">—</span>
									<input
										type="number"
										min={0}
										max={100}
										placeholder="100"
										value={filterForm.maxFame ?? ''}
										onChange={(e) =>
											setFilterForm({
												...filterForm,
												maxFame: e.target.value
													? parseInt(e.target.value, 10)
													: undefined,
											})
										}
										className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-center"
									/>
								</div>
							</div>

							{/* Lieu */}
							<div>
								<label className="block text-sm font-medium text-text-primary mb-3">
									{t('discover.location')}
								</label>
								<input
									type="text"
									placeholder={t('discover.locationPlaceholder')}
									value={filterForm.location || ''}
									onChange={(e) =>
										setFilterForm({
											...filterForm,
											location: e.target.value || undefined,
										})
									}
									className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted"
								/>
							</div>

							{/* Tags */}
							<div>
								<label className="block text-sm font-medium text-text-primary mb-3">
									{t('discover.interests')}
								</label>
								<div className="flex flex-wrap gap-2">
									{availableTags.map((tag) => (
										<button
											key={tag.id}
											type="button"
											onClick={() => toggleFilterTag(tag.name)}
											className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
												filterForm.tags?.includes(tag.name)
													? 'bg-primary text-white'
													: 'bg-surface border border-border text-text-secondary hover:border-primary/50'
											}`}
										>
											#{translateTag(tag.name, t)}
										</button>
									))}
								</div>
							</div>
						</div>

						{/* Footer */}
						<div className="flex gap-3 p-4 border-t border-border">
							<button
								onClick={handleResetFilters}
								className="flex-1 py-3 rounded-xl border border-border text-text-secondary hover:bg-surface transition-colors"
							>
								{t('discover.resetFilters')}
							</button>
							<button
								onClick={handleApplyFilters}
								className="flex-1 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover transition-colors"
							>
								{t('discover.applyFilters')}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Modal profil */}
			<UserProfileModal
				userId={selectedUserId || 0}
				isOpen={selectedUserId !== null}
				onClose={() => setSelectedUserId(null)}
				onUserBlocked={(userId) => {
					setProfiles((prev) => prev.filter((p) => p.id !== userId));
					setTotal((prev) => prev - 1);
				}}
				onInteractionChange={() => {
					// Optionnel : recharger pour mettre à jour les statuts
				}}
			/>
		</Layout>
	);
}
