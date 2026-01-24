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

// Icône personnalisée pour les profils
const createProfileIcon = (isOnline: boolean) => {
	return L.divIcon({
		className: 'custom-marker',
		html: `
			<div style="
				width: 40px;
				height: 40px;
				border-radius: 50%;
				background: ${isOnline ? '#22c55e' : '#e63946'};
				border: 3px solid white;
				box-shadow: 0 2px 8px rgba(0,0,0,0.3);
				display: flex;
				align-items: center;
				justify-content: center;
				color: white;
				font-weight: bold;
				font-size: 14px;
			">
				${isOnline ? '●' : ''}
			</div>
		`,
		iconSize: [40, 40],
		iconAnchor: [20, 40],
		popupAnchor: [0, -40],
	});
};

// Icône pour les clusters (plusieurs profils au même endroit)
const createClusterIcon = (count: number) => {
	return L.divIcon({
		className: 'custom-cluster',
		html: `
			<div style="
				width: 50px;
				height: 50px;
				border-radius: 50%;
				background: linear-gradient(135deg, #e63946, #c1121f);
				border: 3px solid white;
				box-shadow: 0 2px 8px rgba(0,0,0,0.3);
				display: flex;
				align-items: center;
				justify-content: center;
				color: white;
				font-weight: bold;
				font-size: 16px;
			">
				${count}
			</div>
		`,
		iconSize: [50, 50],
		iconAnchor: [25, 50],
		popupAnchor: [0, -50],
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
		: [46.8182, 8.2275]; // Centre de la Suisse

	// Groupe les profils par position
	const groupedProfiles = groupProfilesByLocation(profiles);

	function getPhotoUrl(filename: string | null): string | null {
		if (!filename) return null;
		if (filename.startsWith('http://') || filename.startsWith('https://')) {
			return filename;
		}
		return `http://localhost:3000/uploads/${filename}`;
	}

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
							className: 'user-marker',
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
								icon={createClusterIcon(groupProfiles.length)}
							>
								<Popup>
									<div className="max-h-48 overflow-y-auto">
										<p className="font-medium mb-2">
											{groupProfiles.length} {t('discover.profilesHere')}
										</p>
										{groupProfiles.map((profile) => {
											const photoUrl = getPhotoUrl(profile.profilePhoto);
											return (
												<div
													key={profile.id}
													onClick={() => onProfileClick(profile.id)}
													className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
												>
													{photoUrl ? (
														<img
															src={photoUrl}
															alt={profile.firstName}
															className="w-8 h-8 rounded-full object-cover"
														/>
													) : (
														<div className="w-8 h-8 rounded-full bg-gray-200" />
													)}
													<div>
														<p className="font-medium text-sm">
															{profile.firstName}
															{profile.age && `, ${profile.age}`}
														</p>
														<p className="text-xs text-gray-500">
															🔥 {profile.fameRating}
														</p>
													</div>
												</div>
											);
										})}
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
								icon={createProfileIcon(profile.isOnline)}
							>
								<Popup>
									<div
										onClick={() => onProfileClick(profile.id)}
										className="cursor-pointer min-w-[150px]"
									>
										<div className="flex items-center gap-3">
											{photoUrl ? (
												<img
													src={photoUrl}
													alt={profile.firstName}
													className="w-12 h-12 rounded-full object-cover"
												/>
											) : (
												<div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
													<span className="text-gray-400 text-lg">?</span>
												</div>
											)}
											<div>
												<p className="font-bold">
													{profile.firstName}
													{profile.age && `, ${profile.age}`}
												</p>
												{profile.city && (
													<p className="text-sm text-gray-600">
														{profile.city}
													</p>
												)}
												<p className="text-sm">
													🔥 {profile.fameRating}
													{profile.commonTagsCount > 0 && (
														<span className="ml-2 text-primary">
															• {profile.commonTagsCount}{' '}
															{t('discover.commonTags')}
														</span>
													)}
												</p>
											</div>
										</div>
										<p className="text-xs text-primary mt-2 text-center">
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
