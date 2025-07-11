import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ZoomIn, ZoomOut, Home, MapPin, Heart } from "lucide-react";
import { koreanRegions } from "@/lib/korean-regions";
import type { Region, Message } from "@shared/schema";

interface InteractiveMapProps {
  onRegionSelect?: (region: string) => void;
  userLocation?: { latitude: number; longitude: number } | null;
}

export function InteractiveMap({ onRegionSelect, userLocation }: InteractiveMapProps) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [mapScale, setMapScale] = useState(1);
  const [mapTranslate, setMapTranslate] = useState({ x: 0, y: 0 });
  const [showRegionDialog, setShowRegionDialog] = useState(false);

  const { data: regions = [] } = useQuery<Region[]>({
    queryKey: ["/api/regions"],
  });

  const { data: regionMessages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages/region", selectedRegion],
    enabled: !!selectedRegion,
  });

  const handleRegionClick = (regionName: string) => {
    setSelectedRegion(regionName);
    setShowRegionDialog(true);
    onRegionSelect?.(regionName);
  };

  const handleZoomIn = () => {
    setMapScale(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setMapScale(prev => Math.max(prev / 1.2, 0.5));
  };

  const handleResetView = () => {
    setMapScale(1);
    setMapTranslate({ x: 0, y: 0 });
  };

  const getRegionMessageCount = (regionName: string) => {
    const region = regions.find(r => r.name === regionName);
    return region?.messageCount || 0;
  };

  const getFlowerSize = (messageCount: number) => {
    if (messageCount === 0) return 0;
    if (messageCount < 5) return 8;
    if (messageCount < 10) return 12;
    if (messageCount < 20) return 16;
    return 20;
  };

  return (
    <div className="relative bg-gradient-to-b from-blue-50 to-green-50 rounded-2xl shadow-lg overflow-hidden">
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
        <Button
          onClick={handleZoomIn}
          size="sm"
          className="bg-white text-gray-600 hover:bg-gray-100 shadow-md"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          onClick={handleZoomOut}
          size="sm"
          className="bg-white text-gray-600 hover:bg-gray-100 shadow-md"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          onClick={handleResetView}
          size="sm"
          className="bg-white text-gray-600 hover:bg-gray-100 shadow-md"
        >
          <Home className="h-4 w-4" />
        </Button>
      </div>

      {/* Interactive SVG Map */}
      <div className="w-full h-96 md:h-[600px] relative overflow-hidden">
        <svg
          viewBox="0 0 800 600"
          className="w-full h-full cursor-move"
          style={{
            transform: `scale(${mapScale}) translate(${mapTranslate.x}px, ${mapTranslate.y}px)`,
          }}
        >
          {/* South Korea Territory Outline - Accurate Shape */}
          <g id="south-korea-territory">
            {/* Main Peninsula */}
            <path
              d="M320 80 L340 85 L360 90 L380 95 L400 100 L420 105 L440 115 L460 125 L480 140 L500 160 L515 180 L525 200 L530 220 L528 240 L520 260 L510 280 L495 300 L480 320 L465 340 L450 360 L435 380 L420 400 L405 420 L390 440 L375 460 L360 480 L345 500 L330 515 L315 525 L300 530 L285 532 L270 530 L255 525 L240 515 L225 500 L210 480 L195 460 L180 440 L165 420 L150 400 L135 380 L120 360 L105 340 L90 320 L80 300 L75 280 L80 260 L90 240 L105 220 L120 200 L140 180 L160 160 L180 140 L200 120 L220 100 L240 85 L260 80 L280 78 L300 80 Z"
              fill="#E8F5E8"
              stroke="#2D3748"
              strokeWidth="1.5"
              className="hover:fill-green-100 transition-colors"
            />
            
            {/* Administrative Boundaries */}
            <g id="administrative-boundaries" stroke="#94A3B8" strokeWidth="0.5" fill="none">
              {/* Seoul-Gyeonggi Region */}
              <path d="M250 200 L280 190 L310 195 L340 200 L370 210 L340 240 L310 235 L280 230 L250 225 Z" />
              
              {/* Gangwon Province */}
              <path d="M340 160 L400 155 L450 160 L490 170 L520 180 L490 200 L450 195 L400 190 L340 185 Z" />
              
              {/* Chungcheong Region */}
              <path d="M200 250 L250 245 L300 250 L350 255 L380 260 L350 290 L300 285 L250 280 L200 275 Z" />
              
              {/* Jeolla Region */}
              <path d="M150 320 L200 315 L250 320 L300 325 L330 330 L300 360 L250 355 L200 350 L150 345 Z" />
              
              {/* Gyeongsang Region */}
              <path d="M350 300 L400 295 L450 300 L500 305 L530 310 L500 340 L450 335 L400 330 L350 325 Z" />
              
              {/* Busan-Ulsan Region */}
              <path d="M430 360 L480 355 L520 360 L530 380 L520 400 L480 395 L430 390 Z" />
            </g>
            
            {/* Jeju Island */}
            <ellipse cx="200" cy="580" rx="35" ry="20" fill="#E8F5E8" stroke="#2D3748" strokeWidth="1.5" />
            
            {/* East Sea Islands */}
            <circle cx="580" cy="250" r="3" fill="#E8F5E8" stroke="#2D3748" strokeWidth="1" />
            <circle cx="585" cy="255" r="2" fill="#E8F5E8" stroke="#2D3748" strokeWidth="1" />
            
            {/* West Sea Islands */}
            <circle cx="120" cy="300" r="2" fill="#E8F5E8" stroke="#2D3748" strokeWidth="1" />
            <circle cx="100" cy="320" r="1.5" fill="#E8F5E8" stroke="#2D3748" strokeWidth="1" />
            <circle cx="80" cy="340" r="1" fill="#E8F5E8" stroke="#2D3748" strokeWidth="1" />
          </g>

          {/* Administrative Divisions */}
          <g id="regions">
            {koreanRegions.map((region) => {
              const messageCount = getRegionMessageCount(region.name);
              return (
                <g key={region.name}>
                  <circle
                    cx={region.x}
                    cy={region.y}
                    r="6"
                    fill="#DC143C"
                    opacity="0.7"
                    className="cursor-pointer hover:opacity-100 transition-opacity"
                    onClick={() => handleRegionClick(region.name)}
                  />
                  <text
                    x={region.x + 10}
                    y={region.y + 5}
                    className="text-xs fill-gray-700 pointer-events-none"
                  >
                    {region.name}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Mugunghwa Flowers */}
          <g id="mugunghwa-flowers">
            {koreanRegions.map((region) => {
              const messageCount = getRegionMessageCount(region.name);
              const flowerSize = getFlowerSize(messageCount);
              
              if (flowerSize === 0) return null;

              return (
                <g
                  key={`flower-${region.name}`}
                  className="cursor-pointer hover:opacity-75 transition-opacity"
                  onClick={() => handleRegionClick(region.name)}
                >
                  <circle
                    cx={region.x}
                    cy={region.y}
                    r={flowerSize}
                    fill="#FF69B4"
                    opacity="0.8"
                  />
                  <text
                    x={region.x}
                    y={region.y + 5}
                    textAnchor="middle"
                    className="text-xs fill-white pointer-events-none"
                  >
                    🌺
                  </text>
                  {messageCount > 10 && (
                    <circle
                      cx={region.x}
                      cy={region.y}
                      r={flowerSize + 5}
                      fill="none"
                      stroke="#FFD700"
                      strokeWidth="2"
                      opacity="0.6"
                      className="animate-pulse"
                    />
                  )}
                </g>
              );
            })}
          </g>

          {/* User Location Indicator */}
          {userLocation && (
            <g id="user-location">
              <circle
                cx={400} // This would be calculated based on actual coordinates
                cy={300}
                r="8"
                fill="#3B82F6"
                opacity="0.8"
              />
              <circle
                cx={400}
                cy={300}
                r="15"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2"
                opacity="0.6"
                className="animate-ping"
              />
              <text
                x={400}
                y={285}
                textAnchor="middle"
                className="text-xs fill-gray-700 font-semibold"
              >
                내 위치
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-md">
        <h4 className="font-semibold text-gray-900 mb-2">범례</h4>
        <div className="space-y-1 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-pink-400 rounded-full mr-2"></div>
            <span>무궁화 (응원 메시지)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 border-2 border-yellow-400 rounded-full mr-2"></div>
            <span>활발한 지역</span>
          </div>
          {userLocation && (
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
              <span>내 위치</span>
            </div>
          )}
        </div>
      </div>

      {/* Region Detail Dialog */}
      <Dialog open={showRegionDialog} onOpenChange={setShowRegionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <MapPin className="text-red-600 mr-2 h-5 w-5" />
              {selectedRegion} 지역 응원 메시지
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                무궁화 <span className="font-semibold">{getRegionMessageCount(selectedRegion || "")}</span>송이 피어있습니다
              </p>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {regionMessages.length > 0 ? (
                regionMessages.map((message) => (
                  <Card key={message.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <p className="text-gray-800 mb-2">{message.content}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{new Date(message.createdAt!).toLocaleDateString()}</span>
                        <div className="flex items-center">
                          <Heart className="text-red-400 mr-1 h-3 w-3" />
                          <span>{message.likes}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  아직 이 지역에는 메시지가 없습니다.
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
