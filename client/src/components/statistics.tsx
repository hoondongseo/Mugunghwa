import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, Map, MapPin, Clock } from "lucide-react";
import type { Message } from "@shared/schema";

interface StatisticsData {
	totalMessages: number;
	totalRegions: number;
	todayMessages: number;
	regionStats: Array<{
		region: string;
		messageCount: number;
		percentage: number;
	}>;
}

export function Statistics() {
	const { data: statistics, isLoading } = useQuery<StatisticsData>({
		queryKey: ["/api/statistics"],
	});
	// Fetch all messages to compute city-level participation
	const { data: messages = [] } = useQuery<Message[]>({
		queryKey: ["/api/messages"],
	});

	if (isLoading) {
		return (
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="animate-pulse">
					<div className="h-8 bg-gray-200 rounded mb-4"></div>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
						{[...Array(4)].map((_, i) => (
							<div
								key={i}
								className="h-32 bg-gray-200 rounded"
							></div>
						))}
					</div>
				</div>
			</div>
		);
	}

	const stats = statistics || {
		totalMessages: 0,
		totalRegions: 0,
		todayMessages: 0,
		regionStats: [],
	};
	// Compute city-level stats from messages
	const cityCounts: Record<string, number> = {};
	messages.forEach((msg) => {
		cityCounts[msg.region] = (cityCounts[msg.region] || 0) + 1;
	});
	const cityStats = Object.entries(cityCounts)
		.map(([region, messageCount]) => ({
			region,
			messageCount,
			percentage:
				stats.totalMessages > 0
					? Math.round((messageCount / stats.totalMessages) * 100)
					: 0,
		}))
		.sort((a, b) => b.messageCount - a.messageCount);
	const cityTotalRegions = cityStats.length;

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div className="text-center mb-12">
				<h3 className="text-3xl font-bold text-gray-900 mb-4">
					전국 참여 현황
				</h3>
				<p className="text-lg text-gray-600">
					지역별 응원 메시지 현황을 확인해보세요
				</p>
			</div>

			{/* Statistics Overview */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
				<Card>
					<CardContent className="p-6 text-center">
						<MessageSquare className="h-8 w-8 text-red-600 mx-auto mb-2" />
						<div className="text-3xl font-bold text-red-600 mb-2">
							{stats.totalMessages.toLocaleString()}
						</div>
						<div className="text-sm text-gray-600">총 메시지</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6 text-center">
						<MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-2" />
						<div className="text-3xl font-bold text-blue-600 mb-2">
							{stats.totalMessages.toLocaleString()}
						</div>
						<div className="text-sm text-gray-600">
							피어난 무궁화
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6 text-center">
						<MapPin className="h-8 w-8 text-green-600 mx-auto mb-2" />
						<div className="text-3xl font-bold text-green-600 mb-2">
							{cityTotalRegions}
						</div>
						<div className="text-sm text-gray-600">참여 지역</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6 text-center">
						<Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
						<div className="text-3xl font-bold text-purple-600 mb-2">
							{stats.todayMessages}
						</div>
						<div className="text-sm text-gray-600">오늘 메시지</div>
					</CardContent>
				</Card>
			</div>

			{/* Regional Rankings */}
			<Card>
				<CardHeader>
					<CardTitle className="text-xl font-bold text-gray-900">
						지역별 참여 순위
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{cityStats.slice(0, 10).map((region, index) => (
							<div
								key={region.region}
								className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
							>
								<div className="flex items-center">
									{/* Emphasize top 3 ranks */}
									<Badge
										className={
											`flex items-center justify-center w-8 h-8 text-sm font-bold mr-4 ` +
											(index === 0
												? "bg-yellow-400 text-white"
												: index === 1
												? "bg-gray-400 text-white"
												: index === 2
												? "bg-orange-400 text-white"
												: "bg-gray-200 text-gray-700")
										}
									>
										{index + 1}
									</Badge>
									<div className="flex flex-col">
										<div className="font-semibold text-gray-900">
											{region.region}
										</div>
										<div className="text-sm text-gray-600 mt-1">
											{region.messageCount}개 무궁화
										</div>
									</div>
								</div>
								<div className="flex items-center">
									<div className="w-32 mr-4">
										<Progress
											value={region.percentage}
											className="h-2"
										/>
									</div>
									<span className="text-sm text-gray-600 min-w-[40px]">
										{region.percentage}%
									</span>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
