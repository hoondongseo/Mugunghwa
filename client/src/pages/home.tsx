import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { InteractiveMap } from "@/components/interactive-map";
import type { Message } from "@shared/schema";
import { MessageForm } from "@/components/message-form";
import { MessageFeed } from "@/components/message-feed";
import { Statistics } from "@/components/statistics";
import { LocationBanner } from "@/components/location-banner";
import { useLocation } from "@/hooks/use-location";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Plus, MapPin, Heart } from "lucide-react";

export default function Home() {
	const [isMessageFormOpen, setIsMessageFormOpen] = useState(false);
	const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
	// Track liked message IDs across map and feed
	const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
	// Coordinates to center map on selected message
	const [targetMessage, setTargetMessage] = useState<Message | null>(null);
	// Load liked IDs from localStorage
	useEffect(() => {
		const stored = localStorage.getItem("likedIds");
		if (stored) {
			try {
				const arr = JSON.parse(stored) as number[];
				setLikedIds(new Set(arr));
			} catch {}
		}
	}, []);
	const queryClient = useQueryClient();

	const handleToggleLike = async (id: number) => {
		// Determine current liked state from message likes (covers new messages)
		const currentMsg = queryClient
			.getQueryData<Message[]>(["/api/messages"])
			?.find((msg) => msg.id === id);
		const isLiked = (currentMsg?.likes ?? 0) > 0;
		const newSet = new Set(likedIds);
		const delta = isLiked ? -1 : 1;
		// Optimistic update for UI responsiveness
		if (isLiked) newSet.delete(id);
		else newSet.add(id);
		setLikedIds(newSet);
		localStorage.setItem("likedIds", JSON.stringify(Array.from(newSet)));
		// Optimistically adjust likes count
		queryClient.setQueryData<Message[]>(["/api/messages"], (old) =>
			(old || []).map((msg) =>
				msg.id === id
					? { ...msg, likes: Math.max(0, (msg.likes ?? 0) + delta) }
					: msg
			)
		);
		try {
			// Send like/unlike to server and get updated message
			const response = await apiRequest(
				"POST",
				`/api/messages/${id}/${isLiked ? "unlike" : "like"}`
			);
			const updatedMsg: Message = await response.json();
			// Override optimistic count with server value
			queryClient.setQueryData<Message[]>(["/api/messages"], (old) =>
				(old || []).map((msg) => (msg.id === id ? updatedMsg : msg))
			);
			// Refetch to sync UI immediately
			queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
		} catch (error) {
			console.error(error);
			// Revert optimistic update on error
			const revertSet = new Set(newSet);
			if (isLiked) revertSet.add(id);
			else revertSet.delete(id);
			setLikedIds(revertSet);
			localStorage.setItem(
				"likedIds",
				JSON.stringify(Array.from(revertSet))
			);
			queryClient.setQueryData<Message[]>(["/api/messages"], (old) =>
				(old || []).map((msg) =>
					msg.id === id
						? {
								...msg,
								likes: Math.max(0, (msg.likes ?? 0) - delta),
						  }
						: msg
				)
			);
		}
	};
	const { userLocation, requestLocation, hasPermission } = useLocation();

	const scrollToSection = (sectionId: string) => {
		const element = document.getElementById(sectionId);
		if (element) {
			element.scrollIntoView({ behavior: "smooth" });
		}
	};

	const handleOpenMessageForm = () => {
		if (!hasPermission) {
			requestLocation();
		} else {
			setIsMessageFormOpen(true);
		}
	};

	const handleMessageClick = (message: Message) => {
		setTargetMessage(message);
		scrollToSection("map");
	};

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white shadow-sm border-b-2 border-red-600">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-center items-center py-4">
						<div className="flex items-center space-x-3">
							<img
								src="/images/yoon_again.png"
								alt="윤어게인"
								className="h-12 w-12"
							/>
							<h1 className="text-2xl font-bold text-gray-900">
								윤카 응원 메시지
							</h1>
						</div>
					</div>
				</div>
			</header>

			{/* Hero Section */}
			<section className="bg-gradient-to-r from-red-600 to-blue-600 text-white py-12">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<h2 className="text-4xl md:text-5xl font-bold mb-4">
						함께 피워나가는 무궁화
					</h2>
					<p className="text-xl md:text-2xl mb-8 opacity-90">
						윤석열 대통령과 대한민국을 향한 응원 메시지로 전국에
						무궁화를 피워보세요
					</p>
					<div className="flex justify-center space-x-4">
						<Button
							onClick={() => scrollToSection("map")}
							className="bg-white text-red-600 hover:bg-gray-100 px-8 py-3 text-lg"
						>
							<MapPin className="mr-2 h-5 w-5" />
							지도 보기
						</Button>
						<Button
							onClick={handleOpenMessageForm}
							className="bg-white text-red-600 hover:bg-gray-100 px-8 py-3 text-lg"
						>
							<Heart className="mr-2 h-5 w-5" />
							메시지 남기기
						</Button>
					</div>
				</div>
			</section>

			{/* Location Banner */}
			<LocationBanner />

			{/* Interactive Map Section */}
			<section id="map" className="py-12 bg-white">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-8">
						<h3 className="text-3xl font-bold text-gray-900 mb-4">
							전국 응원 현황
						</h3>
						<p className="text-lg text-gray-600">
							각 지역의 무궁화를 클릭하면 응원 메시지를 확인할 수
							있습니다
						</p>
					</div>
					<InteractiveMap
						onRegionSelect={setSelectedRegion}
						userLocation={userLocation}
						likedIds={likedIds}
						onToggleLike={handleToggleLike}
						targetMessage={targetMessage || undefined}
					/>
				</div>
			</section>

			{/* Statistics Section */}
			<section id="statistics" className="py-12 bg-gray-50">
				<Statistics />
			</section>

			{/* Messages Feed Section */}
			<section id="messages" className="py-12 bg-white">
				<MessageFeed
					selectedRegion={selectedRegion}
					likedIds={likedIds}
					onToggleLike={handleToggleLike}
					onMessageClick={handleMessageClick}
				/>
			</section>

			{/* Footer */}
			<footer className="bg-gray-900 text-white py-12">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						<div>
							<div className="flex items-center space-x-3 mb-4">
								<img
									src="/images/yoon_again.png"
									alt="윤어게인"
									className="h-12 w-12"
								/>
								<h3 className="text-xl font-bold">
									윤카 응원 메시지
								</h3>
							</div>
							<p className="text-gray-400">
								전국 곳곳에서 피어나는 무궁화와 함께
								자유대한민국의 밝은 미래를 응원합니다.
							</p>
						</div>

						<div>
							<h4 className="font-semibold mb-4">
								개인정보 보호
							</h4>
							<ul className="space-y-2 text-sm text-gray-400">
								<li>• 개인 식별 정보는 저장하지 않음</li>
								<li>• 부적절한 내용은 자동 필터링</li>
							</ul>
						</div>

						<div>
							<h4 className="font-semibold mb-4">문의사항</h4>
							<div className="text-sm text-gray-400 space-y-2">
								<p>이메일: younghotsdh@gmail.com</p>
								<p>운영시간: 평일 09:00 - 18:00</p>
							</div>
						</div>
					</div>

					<div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
						<p>
							&copy; 2025 윤카 응원 메시지. All Rights Reserved.
						</p>
					</div>
				</div>
			</footer>

			{/* Message Form Modal */}
			<Dialog
				open={isMessageFormOpen}
				onOpenChange={setIsMessageFormOpen}
			>
				<DialogContent className="sm:max-w-md">
					<MessageForm
						userLocation={userLocation}
						onSuccess={() => setIsMessageFormOpen(false)}
					/>
				</DialogContent>
			</Dialog>

			{/* Floating Action Button */}
			<Dialog>
				<DialogTrigger asChild>
					<Button
						onClick={handleOpenMessageForm}
						className="fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-lg z-40"
						size="lg"
					>
						<Plus className="h-6 w-6" />
					</Button>
				</DialogTrigger>
			</Dialog>
		</div>
	);
}
