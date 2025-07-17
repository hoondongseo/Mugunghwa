import { useState, useEffect, useMemo } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { InteractiveMap } from "@/components/interactive-map";
import { MessageForm } from "@/components/message-form";
import { MessageFeed } from "@/components/message-feed";
import { Statistics } from "@/components/statistics";
import { LocationBanner } from "@/components/location-banner";
import { useLocation } from "@/hooks/use-location";
import { Button } from "@/components/ui/button";
// import { useToast } from "@/hooks/use-toast"; // Toast 대신 모달 사용
import { filterContent } from "@/lib/content-filter";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Plus, MapPin, Heart } from "lucide-react";
import type { Message } from "@shared/schema";

export default function Home() {
	// Single message per device
	const [myMessageId, setMyMessageId] = useState<number | null>(() => {
		const id = localStorage.getItem("myMessageId");
		return id ? Number(id) : null;
	});
	// If the message was deleted (e.g., via admin), clear stored ID
	useEffect(() => {
		if (myMessageId) {
			apiRequest("GET", "/api/messages").then((res) =>
				res.json().then((msgs: Message[]) => {
					if (!msgs.find((m) => m.id === myMessageId)) {
						localStorage.removeItem("myMessageId");
						setMyMessageId(null);
					}
				})
			);
		}
	}, [myMessageId]);
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
		// Determine current liked state from local likedIds
		const isLiked = likedIds.has(id);
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
	// 성공 확인 모달 상태 및 대기 중인 메시지
	const [showSuccessDialog, setShowSuccessDialog] = useState(false);
	const [pendingMessage, setPendingMessage] = useState<Message | null>(null);

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

	// Message form success: save ID and fly to map
	const handleFormSuccess = (newMessage: Message) => {
		// 메시지 저장 및 모달 오픈
		localStorage.setItem("myMessageId", String(newMessage.id));
		setMyMessageId(newMessage.id);
		setIsMessageFormOpen(false);
		// 비행은 모달 확인 후 실행
		setPendingMessage(newMessage);
		setShowSuccessDialog(true);
	};

	// Update own message
	const handleUpdateMessage = async (id: number, content: string) => {
		// Content filter 적용
		if (!filterContent(content)) {
			alert("부적절한 단어가 포함되어 있어 메시지를 수정할 수 없습니다.");
			return;
		}
		try {
			const res = await apiRequest("PUT", `/api/messages/${id}`, {
				content,
			});
			const updated: Message = await res.json();
			queryClient.setQueryData<Message[]>(["/api/messages"], (old) =>
				old ? old.map((m) => (m.id === id ? updated : m)) : []
			);
			// Refresh from server to sync any additional fields
			queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
		} catch (err) {
			console.error(err);
		}
	};

	// Delete own message
	const handleDeleteMessage = async (id: number) => {
		try {
			await apiRequest("DELETE", `/api/messages/${id}`);
			queryClient.setQueryData<Message[]>(["/api/messages"], (old) =>
				old ? old.filter((m) => m.id !== id) : []
			);
			localStorage.removeItem("myMessageId");
			setMyMessageId(null);
		} catch (err) {
			console.error(err);
		}
	};

	// Fetch regions for dropdown menu
	const { data: regionList = [] } = useQuery<{ name: string }[]>({
		queryKey: ["/api/regions"],
		queryFn: () =>
			apiRequest("GET", "/api/regions").then((res) => res.json()),
	});
	// Fetch all messages to derive available regions
	const { data: allMessages = [] } = useQuery<Message[]>({
		queryKey: ["/api/messages"],
		staleTime: 1000 * 60,
		refetchOnWindowFocus: false,
	});
	// Compute distinct regions present in messages
	const availableRegions = useMemo(() => {
		const set = new Set<string>();
		allMessages.forEach((m) => m.region && set.add(m.region));
		return Array.from(set).sort();
	}, [allMessages]);

	return (
		<div className="min-h-screen bg-white">
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
			<section id="statistics" className="py-12 bg-white">
				<Statistics />
			</section>

			{/* Messages Feed Section */}
			<section id="messages" className="py-12 bg-white">
				<MessageFeed
					selectedRegion={selectedRegion}
					likedIds={likedIds}
					onToggleLike={handleToggleLike}
					onMessageClick={handleMessageClick}
					myMessageId={myMessageId}
					onUpdateMessage={handleUpdateMessage}
					onDeleteMessage={handleDeleteMessage}
					onRegionSelect={setSelectedRegion}
					availableRegions={availableRegions}
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
					{myMessageId ? (
						<p className="text-center text-gray-500">
							이미 메시지를 작성하셨습니다.
						</p>
					) : (
						<MessageForm
							userLocation={userLocation}
							onSuccess={handleFormSuccess}
						/>
					)}
				</DialogContent>
			</Dialog>

			{/* Floating Action Button */}
			{!myMessageId && (
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
			)}
			{/* Success Confirmation Dialog */}
			<Dialog
				open={showSuccessDialog}
				onOpenChange={setShowSuccessDialog}
			>
				<DialogContent>
					<div className="p-6 text-center">
						<h3 className="text-xl font-semibold mb-4">
							감사합니다!
						</h3>
						<p className="mb-4">
							여러분의 메시지가 윤석열 대통령님께 큰 힘이 될
							것입니다.
						</p>
						<p className="mb-6">
							📢 애국 시민 여러분, 악법 반대에도 꼭! 참여해주세요.
						</p>
						<div className="flex justify-center space-x-4">
							<Button
								className="bg-red-600 text-white"
								onClick={() =>
									window.open(
										"https://vforkorea.com/assem/",
										"_blank"
									)
								}
							>
								악법 반대 하러가기
							</Button>
							<Button
								variant="outline"
								onClick={() => {
									setShowSuccessDialog(false);
									if (pendingMessage) {
										setTargetMessage(pendingMessage);
									}
									scrollToSection("map");
								}}
							>
								지도 보러가기
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
