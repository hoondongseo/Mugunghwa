import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Heart, MapPin, Clock, TrendingUp } from "lucide-react";
import type { Message } from "@shared/schema";

interface MessageFeedProps {
	selectedRegion?: string | null;
	likedIds: Set<number>;
	onToggleLike: (id: number) => void;
}

export function MessageFeed({
	selectedRegion,
	likedIds,
	onToggleLike,
}: MessageFeedProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [activeFilter, setActiveFilter] = useState<
		"all" | "recent" | "popular" | "region"
	>("all");

	const { data: messages = [], isLoading } = useQuery<Message[]>({
		queryKey: ["/api/messages"],
	});

	const { data: searchResults = [] } = useQuery<Message[]>({
		queryKey: ["/api/messages/search", { q: searchQuery }],
		enabled: searchQuery.length > 0,
	});

	const filteredMessages = () => {
		const baseMessages = searchQuery ? searchResults : messages;

		switch (activeFilter) {
			case "recent":
				return [...baseMessages].sort(
					(a, b) =>
						new Date(b.createdAt!).getTime() -
						new Date(a.createdAt!).getTime()
				);
			case "popular":
				return [...baseMessages].sort(
					(a, b) => (b.likes || 0) - (a.likes || 0)
				);
			case "region":
				return selectedRegion
					? baseMessages.filter(
							(msg) => msg.region === selectedRegion
					  )
					: baseMessages;
			default:
				return baseMessages;
		}
	};

	const filterButtons = [
		{ key: "all", label: "전체", icon: null },
		{ key: "recent", label: "최근", icon: Clock },
		{ key: "popular", label: "인기", icon: TrendingUp },
		{ key: "region", label: "지역별", icon: MapPin },
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
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{filteredMessages().map((message) => (
						<Card
							key={message.id}
							className="hover:shadow-lg transition-shadow"
						>
							<CardContent className="p-6">
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
											).toLocaleDateString()}
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
										onClick={() => onToggleLike(message.id)}
										className="text-red-500 hover:text-red-600 p-0"
										aria-label={
											likedIds.has(message.id)
												? "좋아요 취소"
												: "좋아요"
										}
									>
										<Heart
											className={`mr-1 h-4 w-4 ${
												likedIds.has(message.id)
													? "fill-red-500 text-red-500"
													: ""
											}`}
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
			)}

			{filteredMessages().length === 0 && !isLoading && (
				<div className="text-center py-12">
					<p className="text-gray-500">메시지가 없습니다.</p>
				</div>
			)}
		</div>
	);
}
