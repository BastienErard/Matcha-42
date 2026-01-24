import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from '../../hooks/useTranslation';
import type { BrowseProfile } from '../../api';

// Fix pour les icônes Leaflet avec Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
	iconRetinaUrl: markerIcon2x,
	iconUrl: markerIcon,
	shadowUrl: markerShadow,
});

function getPhotoUrl(filename: string | null): string | null {
	if (!filename) return null;
	if (filename.startsWith('http://') || filename.startsWith('https://')) {
		return filename;
	}
	return `http://localhost:3000/uploads/${filename}`;
}

// Icône avec photo de profil
const createProfileIcon = (photoUrl: string | null, isOnline: boolean) => {
	const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23999"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;
	const backgroundImage = photoUrl
		? `url(${photoUrl})`
		: `url("data:image/svg+xml,${placeholderSvg}")`;

	return L.divIcon({
		className: 'custom-profile-marker',
		html: `
			<div style="
				width: 48px;
				height: 48px;
				border-radius: 50%;
				background-image: ${backgroundImage};
				background-size: cover;
				background-position: center;
				background-color: #e5e5e5;
				border: 3px solid ${isOnline ? '#22c55e' : 'white'};
				box-shadow: 0 2px 8px rgba(0,0,0,0.3);
				cursor: pointer;
			"></div>
			${
				isOnline
					? `
				<div style="
					position: absolute;
					bottom: 2px;
					right: 2px;
					width: 12px;
					height: 12px;
					background: #22c55e;
					border: 2px solid white;
					border-radius: 50%;
				"></div>
			`
					: ''
			}
		`,
		iconSize: [48, 48],
		iconAnchor: [24, 48],
		popupAnchor: [0, -48],
	});
};

// Icône pour les clusters (plusieurs profils au même endroit)
const createClusterIcon = (profiles: BrowseProfile[]) => {
	const count = profiles.length;

	// Affiche jusqu'à 3 photos en preview
	const previewPhotos = profiles.slice(0, 3);
	const photosHtml = previewPhotos
		.map((p, i) => {
			const photoUrl = getPhotoUrl(p.profilePhoto);
			const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23999"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;
			const backgroundImage = photoUrl
				? `url(${photoUrl})`
				: `url("data:image/svg+xml,${placeholderSvg}")`;

			const offset = i * 12;
			return `
			<div style="
				position: absolute;
				left: ${offset}px;
				top: ${offset}px;
				width: 32px;
				height: 32px;
				border-radius: 50%;
				background-image: ${backgroundImage};
				background-size: cover;
				background-position: center;
				background-color: #e5e5e5;
				border: 2px solid white;
				box-shadow: 0 1px 3px rgba(0,0,0,0.2);
				z-index: ${3 - i};
			"></div>
		`;
		})
		.join('');

	return L.divIcon({
		className: 'custom-cluster-marker',
		html: `
			<div style="
				position: relative;
				width: 60px;
				height: 60px;
			">
				${photosHtml}
				<div style="
					position: absolute;
					bottom: -4px;
					right: -4px;
					min-width: 24px;
					height: 24px;
					padding: 0 6px;
					background: linear-gradient(135deg, #e63946, #c1121f);
					border: 2px solid white;
					border-radius: 12px;
					box-shadow: 0 2px 4px rgba(0,0,0,0.2);
					display: flex;
					align-items: center;
					justify-content: center;
					color: white;
					font-weight: bold;
					font-size: 12px;
					z-index: 10;
				">
					${count}
				</div>
			</div>
		`,
		iconSize: [60, 60],
		iconAnchor: [30, 60],
		popupAnchor: [0, -60],
	});
};

interface ProfileMapProps {
	profiles: BrowseProfile[];
	userLocation: { lat: number; lng: number } | null;
	onProfileClick: (profileId: number) => void;
}

// Composant pour recentrer la carte
function MapController({ center }: { center: [number, number] | null }) {
	const map = useMap();

	useEffect(() => {
		if (center) {
			map.setView(center, 10);
		}
	}, [center, map]);

	return null;
}

// Groupe les profils par position (pour gérer les superpositions)
function groupProfilesByLocation(profiles: BrowseProfile[]) {
	const groups: Map<string, BrowseProfile[]> = new Map();

	profiles.forEach((profile) => {
		if (profile.latitude && profile.longitude) {
			// Arrondi à 3 décimales (~100m de précision) pour regrouper les proches
			const key = `${profile.latitude.toFixed(3)},${profile.longitude.toFixed(3)}`;
			const existing = groups.get(key) || [];
			existing.push(profile);
			groups.set(key, existing);
		}
	});

	return groups;
}

export function ProfileMap({ profiles, userLocation, onProfileClick }: ProfileMapProps) {
	const { t } = useTranslation();

	// Centre par défaut : Suisse ou position utilisateur
	const defaultCenter: [number, number] = userLocation
		? [userLocation.lat, userLocation.lng]
		: [46.8182, 8.2275];

	// Groupe les profils par position
	const groupedProfiles = groupProfilesByLocation(profiles);

	return (
		<div className="w-full h-[500px] md:h-[600px] rounded-2xl overflow-hidden border border-border">
			<MapContainer
				center={defaultCenter}
				zoom={userLocation ? 10 : 7}
				style={{ height: '100%', width: '100%' }}
				scrollWheelZoom={true}
			>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>

				<MapController
					center={userLocation ? [userLocation.lat, userLocation.lng] : null}
				/>

				{/* Marker pour la position de l'utilisateur */}
				{userLocation && (
					<Marker
						position={[userLocation.lat, userLocation.lng]}
						icon={L.divIcon({
							className: 'user-location-marker',
							html: `
								<div style="
									width: 20px;
									height: 20px;
									border-radius: 50%;
									background: #3b82f6;
									border: 3px solid white;
									box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.2);
								"></div>
							`,
							iconSize: [20, 20],
							iconAnchor: [10, 10],
						})}
					>
						<Popup>
							<span className="font-medium">{t('discover.yourLocation')}</span>
						</Popup>
					</Marker>
				)}

				{/* Markers pour les profils */}
				{Array.from(groupedProfiles.entries()).map(([key, groupProfiles]) => {
					const [lat, lng] = key.split(',').map(Number);
					const isCluster = groupProfiles.length > 1;

					if (isCluster) {
						// Cluster de plusieurs profils
						return (
							<Marker
								key={key}
								position={[lat, lng]}
								icon={createClusterIcon(groupProfiles)}
							>
								<Popup>
									<div className="max-h-60 overflow-y-auto min-w-[200px]">
										<p className="font-semibold text-gray-700 mb-3 pb-2 border-b">
											{groupProfiles.length} {t('discover.profilesHere')}
										</p>
										<div className="space-y-2">
											{groupProfiles.map((profile) => {
												const photoUrl = getPhotoUrl(profile.profilePhoto);
												return (
													<div
														key={profile.id}
														onClick={() => onProfileClick(profile.id)}
														className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
													>
														{photoUrl ? (
															<img
																src={photoUrl}
																alt={profile.firstName}
																className="w-10 h-10 rounded-full object-cover flex-shrink-0"
															/>
														) : (
															<div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
																<span className="text-gray-400 text-sm">
																	?
																</span>
															</div>
														)}
														<div className="min-w-0">
															<p className="font-medium text-gray-900 truncate">
																{profile.firstName}
																{profile.age && `, ${profile.age}`}
															</p>
															<div className="flex items-center gap-2 text-xs text-gray-500">
																<span>🔥 {profile.fameRating}</span>
																{profile.isOnline && (
																	<span className="text-green-500">
																		● En ligne
																	</span>
																)}
															</div>
														</div>
													</div>
												);
											})}
										</div>
									</div>
								</Popup>
							</Marker>
						);
					} else {
						// Profil unique
						const profile = groupProfiles[0];
						const photoUrl = getPhotoUrl(profile.profilePhoto);

						return (
							<Marker
								key={profile.id}
								position={[lat, lng]}
								icon={createProfileIcon(photoUrl, profile.isOnline)}
							>
								<Popup>
									<div
										onClick={() => onProfileClick(profile.id)}
										className="cursor-pointer min-w-[180px]"
									>
										<div className="flex items-center gap-3">
											{photoUrl ? (
												<img
													src={photoUrl}
													alt={profile.firstName}
													className="w-14 h-14 rounded-full object-cover flex-shrink-0"
												/>
											) : (
												<div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
													<span className="text-gray-400 text-xl">?</span>
												</div>
											)}
											<div className="min-w-0">
												<p className="font-bold text-gray-900">
													{profile.firstName}
													{profile.age && `, ${profile.age}`}
												</p>
												{profile.city && (
													<p className="text-sm text-gray-600 truncate">
														{profile.city}
													</p>
												)}
												<div className="flex items-center gap-2 text-sm">
													<span>🔥 {profile.fameRating}</span>
													{profile.commonTagsCount > 0 && (
														<span className="text-primary">
															• {profile.commonTagsCount}{' '}
															{t('discover.commonTags')}
														</span>
													)}
												</div>
											</div>
										</div>
										<p className="text-xs text-primary mt-2 text-center font-medium">
											{t('discover.clickToView')}
										</p>
									</div>
								</Popup>
							</Marker>
						);
					}
				})}
			</MapContainer>
		</div>
	);
}
