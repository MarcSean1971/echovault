
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MapPin } from "lucide-react";
import { BUTTON_HOVER_EFFECTS, HOVER_TRANSITION } from "@/utils/hoverEffects";
import { Separator } from "@/components/ui/separator";
import { useMessageForm } from "../MessageFormContext";
import MapDisplay from "@/components/location/MapDisplay";
import { reverseGeocode } from "@/services/location/mapboxService";

export function LocationSection() {
  const { 
    shareLocation, 
    setShareLocation,
    locationName, 
    setLocationName,
    locationLatitude, 
    setLocationLatitude,
    locationLongitude, 
    setLocationLongitude
  } = useMessageForm();
  
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to capture user's current location
  const captureLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setIsCapturingLocation(true);
    setError(null);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocationLatitude(latitude);
        setLocationLongitude(longitude);
        
        // Use our secure mapbox service for reverse geocoding
        try {
          const placeName = await reverseGeocode(latitude, longitude);
          setLocationName(placeName || "Unknown location");
        } catch (error) {
          console.error("Error getting location name:", error);
          setLocationName("Location captured (address unavailable)");
        }
        
        setIsCapturingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        setError(`Could not capture location: ${error.message}`);
        setIsCapturingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Automatically capture location when shareLocation is toggled on
  useEffect(() => {
    if (shareLocation && !locationLatitude && !locationLongitude) {
      captureLocation();
    }
  }, [shareLocation, locationLatitude, locationLongitude]);

  // Function to clear location data
  const clearLocation = () => {
    setLocationLatitude(null);
    setLocationLongitude(null);
    setLocationName("");
  };

  return (
    <div className="space-y-4">
      <Separator />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MapPin className={`h-5 w-5 text-muted-foreground ${HOVER_TRANSITION}`} />
          <Label htmlFor="share-location" className="font-medium">Share Location</Label>
        </div>
        <Switch 
          id="share-location"
          checked={shareLocation}
          onCheckedChange={setShareLocation}
          className={HOVER_TRANSITION}
        />
      </div>
      
      {shareLocation && (
        <div className="space-y-4 pl-7">
          <p className="text-sm text-muted-foreground">
            {isCapturingLocation 
              ? "Capturing your current location..." 
              : "Recipients will see your current location when viewing this message."}
          </p>
          
          {error && (
            <div className="p-3 border border-red-200 bg-red-50 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}
          
          {locationLatitude && locationLongitude ? (
            <div className="space-y-4">
              {/* Map display */}
              <MapDisplay 
                latitude={locationLatitude} 
                longitude={locationLongitude} 
                locationName={locationName}
                height="200px"
              />
              
              <div className="p-3 border rounded-lg bg-background">
                <p className="font-semibold">{locationName || 'Location captured'}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Coordinates: {locationLatitude.toFixed(6)}, {locationLongitude.toFixed(6)}
                </p>
              </div>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearLocation}
                className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.outline}`}
              >
                Clear Location
              </Button>
            </div>
          ) : (
            isCapturingLocation && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                <span>Capturing location...</span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
