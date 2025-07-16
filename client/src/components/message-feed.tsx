import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Heart, Clock, TrendingUp, Edit2, Trash2 } from "lucide-react";
import type { Message } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface MessageFeedProps {
	selectedRegion?: string | null;
	likedIds: Set<number>;
	onToggleLike: (id: number) => void;
	onMessageClick?: (message: Message) => void;
	// ID of the message created on this device
	myMessageId?: number | null;
	// Handler to update a message content
	onUpdateMessage?: (id: number, content: string) => void;
	// Handler to delete a message
	onDeleteMessage?: (id: number) => void;
}

export function MessageFeed({
	selectedRegion,
	likedIds,
	onToggleLike,
	onMessageClick,
	myMessageId,
	onUpdateMessage,
	onDeleteMessage,
}: MessageFeedProps) {
	const [searchQuery, setSearchQuery] = useState("");
	// Pagination state: number of pages to show via Load More
	const PAGE_SIZE = 9;
	const [page, setPage] = useState(1);
	const gridRef = useRef<HTMLDivElement>(null);
	const [activeFilter, setActiveFilter] = useState<
		"all" | "recent" | "popular" | "mine"
	>("all");

	const { data: messages = [], isLoading } = useQuery<Message[]>({
		queryKey: ["/api/messages"],
		// Prevent automatic refetch to preserve optimistic updates
		staleTime: 1000 * 60, // 1 minute
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		refetchOnReconnect: false,
	});

	const { data: searchResults = [] } = useQuery<Message[]>({
		queryKey: ["/api/messages/search", { q: searchQuery }],
		enabled: searchQuery.length > 0,
	});

	// Filter and sort messages
	const filteredMessages = () => {
		let baseMessages = searchQuery ? searchResults : messages;
		// Apply region filter from parent prop
		if (selectedRegion) {
			baseMessages = baseMessages.filter(
				(msg) => msg.region === selectedRegion
			);
		}
		switch (activeFilter) {
			case "recent":
				return [
					...baseMessages.sort(
						(a, b) =>
							new Date(b.createdAt!).getTime() -
							new Date(a.createdAt!).getTime()
					),
				];
			case "popular":
				return [
					...baseMessages.sort(
						(a, b) => (b.likes || 0) - (a.likes || 0)
					),
				];
			case "mine":
				if (myMessageId != null) {
					const myMsg = baseMessages.find(
						(msg) => msg.id === myMessageId
					);
					return myMsg ? [myMsg] : [];
				}
				return [];
			default:
				return [
					...baseMessages.sort(
						(a, b) =>
							new Date(b.createdAt!).getTime() -
							new Date(a.createdAt!).getTime()
					),
				];
		}
	};

	// Reset page when filter or search changes
	useEffect(() => {
		setPage(1);
	}, [activeFilter, searchQuery]);

	const visibleMessages = filteredMessages().slice(0, page * PAGE_SIZE);

	// Filter button definitions (including region)
	const filterButtons = [
		{ key: "all", label: "전체", icon: null },
		{ key: "recent", label: "최근", icon: Clock },
		{ key: "popular", label: "인기", icon: TrendingUp },
		{ key: "mine", label: "내가 작성한 메시지", icon: Heart },
	] as const;

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div className="text-center mb-12">
				<h3 className="text-3xl font-bold text-gray-900 mb-4">
					전국 응원 메시지
				</h3>
				<p className="text-lg text-gray-600">
					대한민국 곳곳에서 온 따뜻한 응원의 목소리
				</p>
			</div>

			{/* Filter Controls */}
			<div className="flex flex-wrap gap-4 mb-8 justify-center">
				{filterButtons.map(({ key, label, icon: Icon }) => (
					<Button
						key={key}
						onClick={() => setActiveFilter(key)}
						variant={activeFilter === key ? "default" : "outline"}
						className={
							activeFilter === key
								? "bg-red-600 hover:bg-red-700 text-white"
								: "text-gray-700 hover:bg-gray-100"
						}
					>
						{Icon && <Icon className="mr-2 h-4 w-4" />}
						{label}
					</Button>
				))}
			</div>

			{/* Search Bar */}
			<div className="max-w-md mx-auto mb-8">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
					<Input
						type="text"
						placeholder="메시지 검색..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-10"
					/>
				</div>
			</div>

			{/* Messages Grid */}
			{isLoading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{[...Array(6)].map((_, i) => (
						<Card key={i} className="animate-pulse">
							<CardContent className="p-6">
								<div className="h-4 bg-gray-200 rounded mb-2"></div>
								<div className="h-4 bg-gray-200 rounded mb-4"></div>
								<div className="h-16 bg-gray-200 rounded mb-4"></div>
								<div className="h-4 bg-gray-200 rounded w-1/2"></div>
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{visibleMessages.map((message) => (
							<Card
								key={message.id}
								className="hover:shadow-lg transition-shadow cursor-pointer"
								onClick={() => onMessageClick?.(message)}
							>
								<CardContent className="p-6 relative">
									{/* Edit/Delete for own message: top-right corner */}
									{message.id === myMessageId && (
										<div className="absolute top-2 right-4 flex flex-row space-x-4">
											<Button
												variant="ghost"
												size="sm"
												onClick={(e) => {
													e.stopPropagation();
													const newContent = prompt(
														"메시지를 수정하세요:",
														message.content
													);
													if (
														newContent !== null &&
														newContent.trim() !== ""
													) {
														onUpdateMessage?.(
															message.id,
															newContent.trim()
														);
													}
												}}
												className="hover:text-blue-600 p-0"
												aria-label="수정"
											>
												<Edit2 className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={(e) => {
													e.stopPropagation();
													if (
														confirm(
															"이 메시지를 삭제하시겠습니까?"
														)
													) {
														onDeleteMessage?.(
															message.id
														);
													}
												}}
												className="hover:text-gray-600 p-0"
												aria-label="삭제"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									)}
									<div className="flex items-center mb-4">
										<div className="w-10 h-10 bg-gradient-to-br from-red-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
											🌺
										</div>
										<div>
											<div className="font-semibold text-gray-900">
												{message.region}
											</div>
											<div className="text-sm text-gray-600">
												{new Date(
													message.createdAt!
												).toLocaleString("ko-KR", {
													dateStyle: "short",
													timeStyle: "short",
												})}
											</div>
										</div>
									</div>

									<p className="text-gray-800 mb-4 line-clamp-3">
										{message.content}
									</p>

									<div className="flex items-center justify-between">
										<Button
											variant="ghost"
											size="sm"
											onClick={(e) => {
												e.stopPropagation();
												onToggleLike(message.id);
											}}
											className="hover:text-red-600 p-0"
											aria-label={
												likedIds.has(message.id)
													? "좋아요 취소"
													: "좋아요"
											}
										>
											<Heart
												className="mr-1 h-4 w-4 text-red-500"
												style={{
													fill: likedIds.has(
														message.id
													)
														? "currentColor"
														: "none",
												}}
											/>
											<span className="text-sm">
												{message.likes || 0}
											</span>
										</Button>
										<Badge
											variant="secondary"
											className="text-xs"
										>
											{message.subregion}
										</Badge>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
					{visibleMessages.length === 0 && !isLoading && (
						<div className="text-center py-12">
							<p className="text-gray-500">메시지가 없습니다.</p>
						</div>
					)}
					{/* Load More button for mobile/desktop */}
					{filteredMessages().length > visibleMessages.length && (
						<div className="flex justify-center mt-6">
							<Button
								onClick={() => setPage((p) => p + 1)}
								variant="outline"
							>
								더 불러오기
							</Button>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
