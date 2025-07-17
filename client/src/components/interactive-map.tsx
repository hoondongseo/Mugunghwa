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
import { koreanRegions } from "@/lib/korean-regions";

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
					   // Use region centroid for privacy
					   const regionMeta = koreanRegions.find(r => r.name === msg.region);
					   if (!regionMeta) return null;
					   const baseLat = regionMeta.lat;
					   const baseLng = regionMeta.lng;
					   // Small deterministic jitter (~10m)
					   const jitter = 0.0001;
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
									if
