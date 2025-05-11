
import { MapDisplay } from "@/components/location/MapDisplay";
import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface LocationDisplayProps {
  latitude: number;
  longitude: number;
  locationName: string | null;
}

export function LocationDisplay({ latitude, longitude, locationName }: LocationDisplayProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className={`h-5 w-5 text-blue-500 ${HOVER_TRANSITION}`} />
        <h3 className="text-lg font-medium">Location</h3>
      </div>
      
      <Card className="overflow-hidden border">
        {/* Map display */}
        <MapDisplay 
          latitude={latitude} 
          longitude={longitude}
          locationName={locationName}
          height="250px"
        />
        
        <div className="p-4 border-t">
          <p className="font-medium">{locationName || 'Shared location'}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </p>
        </div>
      </Card>
    </div>
  );
}
