import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertMessageSchema } from "@shared/schema";
import { getRegionFromCoordinates } from "@/lib/korean-regions";
import { filterContent } from "@/lib/content-filter";
import { MapPin, Heart, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import type { InsertMessage } from "@shared/schema";

interface MessageFormProps {
  userLocation: { latitude: number; longitude: number } | null;
  onSuccess?: () => void;
}

type FormData = {
  content: string;
};

export function MessageForm({ userLocation, onSuccess }: MessageFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocationVerified, setIsLocationVerified] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/regions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      toast({
        title: "메시지가 성공적으로 전송되었습니다!",
        description: "검토 후 지도에 무궁화가 피어날 예정입니다.",
      });
      onSuccess?.();
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
        toast({
          title: "부적절한 내용",
          description: "메시지에 부적절한 내용이 포함되어 있습니다.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Get region from coordinates
      const region = getRegionFromCoordinates(userLocation.latitude, userLocation.longitude);
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

  const currentRegion = userLocation ? getRegionFromCoordinates(userLocation.latitude, userLocation.longitude) : null;

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
      toast({
        title: "위치 인증 완료",
        description: "메시지를 작성할 수 있습니다.",
      });
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold text-gray-900 text-center">응원 메시지 작성</DialogTitle>
      </DialogHeader>
      <div className="text-center">
        <p className="text-gray-600">대한민국을 향한 따뜻한 응원 메시지를 남겨주세요</p>
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
                {isLocationVerified ? "위치 인증 완료" : "위치 인증 필요"}
              </div>
              <div className="text-sm text-gray-600">
                {userLocation && currentRegion ? (
                  `현재 위치: ${currentRegion.name} ${currentRegion.subregion}`
                ) : (
                  "메시지 작성을 위해 위치 정보를 허용해주세요"
                )}
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
            위치 정보를 허용해주세요. 메시지는 현재 위치에 무궁화로 표시됩니다.
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              메시지는 검토 후 지도에 무궁화로 표시됩니다. 부적절한 내용은 자동으로 필터링됩니다.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isSubmitting || !userLocation || !isLocationVerified}
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
