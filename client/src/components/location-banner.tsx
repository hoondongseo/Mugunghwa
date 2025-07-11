import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLocation } from "@/hooks/use-location";
import { MapPin, X } from "lucide-react";

export function LocationBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const { hasPermission, requestLocation } = useLocation();

  if (!isVisible || hasPermission) {
    return null;
  }

  return (
    <Alert className="bg-yellow-50 border-l-4 border-yellow-400">
      <MapPin className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <strong className="text-yellow-800">위치 정보 사용 안내:</strong>
          <span className="text-yellow-800 ml-2">
            메시지 작성 시 귀하의 위치(시/군/구)에 무궁화가 피어납니다.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={requestLocation}
            className="bg-yellow-400 text-yellow-800 hover:bg-yellow-500"
            size="sm"
          >
            위치 허용
          </Button>
          <Button
            onClick={() => setIsVisible(false)}
            variant="ghost"
            size="sm"
            className="text-yellow-600 hover:text-yellow-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
