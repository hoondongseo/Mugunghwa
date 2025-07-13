import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
// import { koreanRegions } from "@/lib/korean-regions"; // region lookup if needed
import {
	MapContainer,
	TileLayer,
	CircleMarker,
	Popup,
	useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Region, Message as MessageType } from "@shared/schema";
import { useState } from "react";

interface InteractiveMapProps {
	onRegionSelect?: (region: string) => void;
	userLocation?: { latitude: number; longitude: number } | null;
	likedIds: Set<number>;
	onToggleLike: (id: number) => void;
}

export function InteractiveMap({
	onRegionSelect,
	userLocation,
	likedIds,
	onToggleLike,
}: InteractiveMapProps): JSX.Element {
	// QueryClient not needed here; parent manages query invalidation

	// Close popup on map click
	function MapClickHandler() {
		const map = useMapEvents({ click: () => map.closePopup() });
		return null;
	}

	// fetch messages
	const { data: allMessages = [] } = useQuery<MessageType[]>({
		queryKey: ["/api/messages"],
	});

	// Use onToggleLike prop
	const handleToggleLike = (id: number) => onToggleLike(id);

	return (
		<div className="relative bg-gradient-to-b from-blue-50 to-green-50 rounded-lg border shadow-sm overflow-hidden">
			{/* Interactive Map using react-leaflet and OpenStreetMap tiles */}
			<div className="w-full h-96 md:h-[600px] relative z-0">
				<MapContainer
					center={[36.5, 127.8]}
					zoom={7}
					scrollWheelZoom
					attributionControl={false}
					minZoom={7}
					className="h-full w-full z-0 rounded-lg"
				>
					{/* map clicks close popup */}
					<MapClickHandler />

					<TileLayer
						url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
						attribution="&copy; OpenStreetMap contributors"
					/>
					{allMessages.map((msg) => {
						const lat = parseFloat(msg.latitude);
						const lng = parseFloat(msg.longitude);
						return (
							<CircleMarker
								key={msg.id}
								center={[lat, lng]}
								radius={6}
								pathOptions={{
									color: "#FF69B4",
									fillOpacity: 0.8,
								}}
								eventHandlers={{
									click: (e) => {
										e.originalEvent.stopPropagation();
										e.target.openPopup();
										onRegionSelect?.(msg.region);
									},
								}}
							>
								<Popup closeOnClick={false} autoClose={false}>
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
														handleToggleLike(
															msg.id
														);
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
														className={`${
															likedIds.has(msg.id)
																? "fill-red-400 text-red-400"
																: "text-red-400"
														} h-3 w-3`}
													/>
												</button>
												<span>{msg.likes || 0}</span>
											</div>
										</div>
									</div>
								</Popup>
							</CircleMarker>
						);
					})}
				</MapContainer>
			</div>
		</div>
	);
}
