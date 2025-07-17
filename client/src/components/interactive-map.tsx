// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import {
	MapContainer,
	TileLayer,
	Marker,
	Popup,
	useMapEvents,
	useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { Message as MessageType } from "@shared/schema";
import { useEffect, useRef } from "react";

interface InteractiveMapProps {
	onRegionSelect?: (region: string) => void;
	userLocation?: { latitude: number; longitude: number } | null;
	likedIds: Set<number>;
	onToggleLike: (id: number) => void;
	targetMessage?: MessageType;
}

export function InteractiveMap({
	onRegionSelect,
	userLocation,
	likedIds,
	onToggleLike,
	targetMessage,
}: InteractiveMapProps): JSX.Element {
	// Close popup on map click
	function MapClickHandler() {
		const map = useMapEvents({ click: () => map.closePopup() });
		return null;
	}

	// fetch messages without auto-refetch to preserve optimistic updates
	const { data: allMessages = [] } = useQuery<MessageType[]>({
		queryKey: ["/api/messages"],
		staleTime: 60000,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		refetchOnReconnect: false,
	});

	// refs for markers and custom icon
	const markerRefs = useRef<Record<number, L.Marker>>({});
	const mugunghwaIcon = new L.Icon({
		iconUrl: "/images/mugunghwa.png",
		iconSize: [32, 32],
		iconAnchor: [16, 32],
		popupAnchor: [0, -32],
	});

	return (
		<div className="relative bg-gradient-to-b from-blue-50 to-green-50 rounded-lg border shadow-sm overflow-hidden">
			<div className="w-full h-96 md:h-[600px] relative z-0">
				<MapContainer
					center={[36.5, 127.8]}
					zoom={7}
					scrollWheelZoom={true}
					touchZoom={false} // 터치 줌 비활성화
					attributionControl={false}
					minZoom={7}
					maxZoom={7} // 최대 확대 레벨 제한 (개인정보 보호)
					className="h-full w-full z-0 rounded-lg"
				>
					{targetMessage && (
						<MapUpdater
							message={targetMessage}
							markerRefs={markerRefs}
						/>
					)}
					<MapClickHandler />
					<TileLayer
						url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
						attribution="&copy; OpenStreetMap contributors"
					/>
					{allMessages.map((msg) => {
						const baseLat = parseFloat(msg.latitude);
						const baseLng = parseFloat(msg.longitude);
						const jitter = 0.0001; // ~10m deterministic jitter
						const offsets: [number, number][] = [
							[jitter, jitter],
							[jitter, -jitter],
							[-jitter, jitter],
							[-jitter, -jitter],
						];
						const idx = msg.id % offsets.length;
						const [latOff, lngOff] = offsets[idx];
						const lat = baseLat + latOff;
						const lng = baseLng + lngOff;
						return (
							<Marker
								key={msg.id}
								position={[lat, lng]}
								icon={mugunghwaIcon}
								ref={(ref) => {
									if (ref) markerRefs.current[msg.id] = ref;
								}}
								eventHandlers={{
									click: (e) => {
										e.originalEvent.stopPropagation();
										e.target.openPopup();
										onRegionSelect?.(msg.region);
									},
								}}
							>
								<Popup>
									<div className="space-y-2">
										<p className="font-semibold">
											{msg.region}
										</p>
										<p>{msg.content}</p>
										<div className="flex items-center justify-between text-xs text-gray-500">
											<span>
												{new Date(
													msg.createdAt!
												).toLocaleDateString()}
											</span>
											<div className="flex items-center">
												<button
													onClick={(e) => {
														e.stopPropagation();
														onToggleLike(msg.id);
													}}
													className="mr-1"
													aria-label={
														likedIds.has(msg.id)
															? "좋아요 취소"
															: "좋아요"
													}
													title={
														likedIds.has(msg.id)
															? "좋아요 취소"
															: "좋아요"
													}
												>
													<Heart
														className="mr-1 h-3 w-3 text-red-400"
														style={{
															stroke: "currentColor",
															fill: likedIds.has(
																msg.id
															)
																? "currentColor"
																: "none",
														}}
													/>
												</button>
												<span>{msg.likes || 0}</span>
											</div>
										</div>
									</div>
								</Popup>
							</Marker>
						);
					})}
				</MapContainer>
			</div>
		</div>
	);
}

function MapUpdater({
	message,
	markerRefs,
}: {
	message: MessageType;
	markerRefs: React.MutableRefObject<Record<number, L.Marker>>;
}) {
	const map = useMap();
	useEffect(() => {
		if (!message.latitude || !message.longitude) return;
		// Parse raw coordinates
		const rawLat = parseFloat(message.latitude);
		const rawLng = parseFloat(message.longitude);
		const rawTarget: [number, number] = [rawLat, rawLng];
		// Determine center target: at max zoom use jittered marker position
		const currentZoom = map.getZoom();
		const maxZoom = map.getMaxZoom();
		const marker = markerRefs.current[message.id];
		const centerTarget: [number, number] =
			currentZoom === maxZoom && marker
				? [marker.getLatLng().lat, marker.getLatLng().lng]
				: rawTarget;
		map.setView(centerTarget);
		// Determine duration: slower if fully zoomed out, otherwise faster
		const minZoom = map.getMinZoom();
		const duration = currentZoom === minZoom ? 1.0 : 0.5;
		map.flyTo(centerTarget, maxZoom, { animate: true, duration });
		map.once("moveend", () => {
			const marker = markerRefs.current[message.id];
			if (marker) marker.openPopup();
		});
	}, [message, map]);
	return null;
}
