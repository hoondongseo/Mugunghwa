import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface LocationState {
  userLocation: { latitude: number; longitude: number } | null;
  hasPermission: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    userLocation: null,
    hasPermission: false,
    isLoading: false,
    error: null,
  });
  const { toast } = useToast();

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      const error = "이 브라우저는 위치 정보를 지원하지 않습니다.";
      setState(prev => ({ ...prev, error }));
      toast({
        title: "위치 정보 지원 안함",
        description: error,
        variant: "destructive",
      });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setState({
          userLocation: { latitude, longitude },
          hasPermission: true,
          isLoading: false,
          error: null,
        });
        // Show permission granted toast only once
        const noticeKey = 'locationPermissionToastShown';
        if (!localStorage.getItem(noticeKey)) {
          toast({
            title: "위치 정보 허용됨",
            description: "메시지를 작성할 수 있습니다.",
          });
          localStorage.setItem(noticeKey, 'true');
        }
      },
      (error) => {
        let errorMessage = "위치 정보를 가져올 수 없습니다.";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "위치 정보 접근이 거부되었습니다.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "위치 정보를 사용할 수 없습니다.";
            break;
          case error.TIMEOUT:
            errorMessage = "위치 정보 요청이 시간 초과되었습니다.";
            break;
        }

        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        
        toast({
          title: "위치 정보 오류",
          description: errorMessage,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000, // 10 minutes
      }
    );
  };

  // Check if location permission is already granted
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (result.state === "granted") {
          requestLocation();
        }
      });
    }
  }, []);

  return {
    ...state,
    requestLocation,
  };
}
