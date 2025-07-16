import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertMessageSchema } from "@shared/schema";
import { getRegionFromCoordinatesAsync } from "@/lib/korean-regions";
import { filterContent } from "@/lib/content-filter";
import { MapPin, Heart, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import type { InsertMessage, Message } from "@shared/schema";

interface MessageFormProps {
	userLocation: { latitude: number; longitude: number } | null;
	onSuccess?: (newMessage: Message) => void;
}

type FormData = {
	content: string;
};

export function MessageForm({ userLocation, onSuccess }: MessageFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLocationVerified, setIsLocationVerified] = useState(false);
	const [isLocationLoading, setIsLocationLoading] = useState(false);
	const [regionData, setRegionData] = useState<{
		name: string;
		subregion: string;
	} | null>(null);
	const [regionLoading, setRegionLoading] = useState(false);
	const { toast } = useToast();
	const queryClient = useQueryClient();
	useEffect(() => {
		if (userLocation) {
			setRegionLoading(true);
			getRegionFromCoordinatesAsync(
				userLocation.latitude,
				userLocation.longitude
			)
				.then((data) => {
					setRegionData(data || null);
					if (!data) {
						toast({
							title: "지역 정보 없음",
							description: "행정구역 정보를 가져올 수 없습니다.",
							variant: "destructive",
						});
					}
				})
				.catch((err) => {
					console.error("Async region lookup failed", err);
					setRegionData(null);
					toast({
						title: "위치 확인 실패",
						description:
							"행정구역 정보를 가져오는 중 오류가 발생했습니다.",
						variant: "destructive",
					});
				})
				.finally(() => setRegionLoading(false));
		} else {
			setRegionData(null);
		}
	}, [userLocation]);

	const form = useForm<FormData>({
		resolver: zodResolver(insertMessageSchema.pick({ content: true })),
		defaultValues: {
			content: "",
		},
	});

	const createMessageMutation = useMutation({
		mutationFn: async (data: InsertMessage) => {
			const response = await apiRequest("POST", "/api/messages", data);
			return response.json();
		},
		onSuccess: (newMessage: Message) => {
			// Optimistically add the new message to the cache (avoid refetch to preserve optimistic updates)
			queryClient.setQueryData<Message[]>(["/api/messages"], (old) =>
				old ? [newMessage, ...old] : [newMessage]
			);
			queryClient.invalidateQueries({ queryKey: ["/api/regions"] });
			queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
			const toastInstance = toast({
				title: "메시지가 성공적으로 전송되었습니다!",
				description: "검토 후 지도에 무궁화가 피어날 예정입니다.",
			});
			// Dismiss this toast after 2 seconds
			setTimeout(() => toastInstance.dismiss(), 2000);
			onSuccess?.(newMessage);
		},
		onError: (error: any) => {
			toast({
				title: "메시지 전송 실패",
				description: error.message || "다시 시도해주세요.",
				variant: "destructive",
			});
		},
	});

	const onSubmit = async (data: FormData) => {
		if (!userLocation) {
			toast({
				title: "위치 정보 필요",
				description: "메시지를 남기려면 위치 정보를 허용해주세요.",
				variant: "destructive",
			});
			return;
		}

		setIsSubmitting(true);

		try {
			// Filter content for inappropriate language
			const isContentAppropriate = filterContent(data.content);
			if (!isContentAppropriate) {
				// Show inline form error for content field
				form.setError("content", {
					type: "manual",
					message:
						"부적절한 내용이 포함되어 있습니다. 내용을 수정해주세요.",
				});
				setIsSubmitting(false);
				return;
			}

			// Ensure region lookup has completed
			if (regionLoading) {
				toast({
					title: "지역 확인 중...",
					description: "잠시만 기다려주세요.",
					variant: "destructive",
				});
				setIsSubmitting(false);
				return;
			}
			const region = regionData;
			if (!region) {
				toast({
					title: "지역 확인 실패",
					description: "현재 위치의 지역을 확인할 수 없습니다.",
					variant: "destructive",
				});
				setIsSubmitting(false);
				return;
			}

			const messageData: InsertMessage = {
				content: data.content,
				region: region.name,
				subregion: region.subregion,
				latitude: userLocation.latitude.toString(),
				longitude: userLocation.longitude.toString(),
			};

			await createMessageMutation.mutateAsync(messageData);
			form.reset();
		} catch (error) {
			console.error("Failed to submit message:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	// Removed synchronous region lookup: use regionData and regionLoading state instead

	const handleLocationVerification = async () => {
		if (!userLocation) {
			toast({
				title: "위치 정보 필요",
				description: "먼저 위치 정보를 허용해주세요.",
				variant: "destructive",
			});
			return;
		}

		setIsLocationLoading(true);

		// Simulate location verification process
		setTimeout(() => {
			setIsLocationVerified(true);
			setIsLocationLoading(false);
			const toastInstance = toast({
				title: "위치 인증 완료",
				description: "메시지를 작성할 수 있습니다.",
			});
			// Dismiss this toast after 1 second
			setTimeout(() => toastInstance.dismiss(), 2000);
		}, 1500);
	};

	// Compute displayRegion based solely on async lookup
	const displayRegion = userLocation
		? regionLoading
			? null
			: regionData
		: null;
	return (
		<div className="space-y-6">
			<DialogHeader>
				<DialogTitle className="text-xl font-bold text-gray-900 text-center">
					응원 메시지 작성
				</DialogTitle>
			</DialogHeader>
			<div className="text-center">
				<p className="text-gray-600">
					대한민국을 향한 따뜻한 응원 메시지를 남겨주세요
				</p>
			</div>

			{/* Location Verification Section */}
			<div className="bg-gray-50 p-4 rounded-lg border">
				<div className="flex items-center justify-between">
					<div className="flex items-center">
						{isLocationVerified ? (
							<CheckCircle className="text-green-600 mr-2 h-5 w-5" />
						) : (
							<MapPin className="text-gray-400 mr-2 h-5 w-5" />
						)}
						<div>
							<div className="font-semibold text-gray-900">
								{isLocationVerified
									? "위치 인증 완료"
									: "위치 인증 필요"}
							</div>
							<div className="text-sm text-gray-600">
								{!isLocationVerified
									? "위치 인증을 완료해주세요"
									: userLocation
									? regionLoading
										? "지역 확인 중..."
										: displayRegion
										? displayRegion.subregion
											? `현재 위치: ${displayRegion.name} ${displayRegion.subregion}`
											: `현재 위치: ${displayRegion.name}`
										: "현재 위치 정보를 불러올 수 없습니다"
									: "메시지 작성을 위해 위치 정보를 허용해주세요"}
							</div>
						</div>
					</div>
					{!isLocationVerified && userLocation && (
						<Button
							onClick={handleLocationVerification}
							disabled={isLocationLoading}
							className="bg-blue-600 hover:bg-blue-700"
							size="sm"
						>
							{isLocationLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									인증 중...
								</>
							) : (
								<>
									<CheckCircle className="mr-2 h-4 w-4" />
									위치 인증
								</>
							)}
						</Button>
					)}
				</div>
			</div>

			{!userLocation && (
				<Alert>
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						위치 정보 사용 안내: 메시지 작성 시 귀하의
						위치(시/군/구)에 무궁화가 피어납니다.
					</AlertDescription>
				</Alert>
			)}

			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="space-y-4"
				>
					<FormField
						control={form.control}
						name="content"
						render={({ field }) => (
							<FormItem>
								<FormLabel>메시지</FormLabel>
								<FormControl>
									<Textarea
										placeholder="윤석열 대통령과 대한민국을 향한 응원 메시지를 남겨보세요..."
										className="min-h-[120px] resize-none"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<Alert>
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							메시지는 검토 후 지도에 무궁화로 표시됩니다.
							부적절한 내용은 자동으로 필터링됩니다.
						</AlertDescription>
					</Alert>

					<div className="flex gap-3">
						<Button
							type="submit"
							disabled={
								isSubmitting ||
								!userLocation ||
								!isLocationVerified
							}
							className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50"
						>
							<Heart className="mr-2 h-4 w-4" />
							{isSubmitting ? "전송 중..." : "메시지 남기기"}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
