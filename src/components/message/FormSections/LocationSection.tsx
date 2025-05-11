
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MapPin } from "lucide-react";
import { BUTTON_HOVER_EFFECTS, HOVER_TRANSITION } from "@/utils/hoverEffects";
import { Separator } from "@/components/ui/separator";
import { useMessageForm } from "../MessageFormContext";

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

  // Function to capture user's current location
  const captureLocation = () => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by your browser");
      return;
    }

    setIsCapturingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLocationLatitude(position.coords.latitude);
        setLocationLongitude(position.coords.longitude);
        
        // Attempt to reverse geocode the location
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${position.coords.longitude},${position.coords.latitude}.json?access_token=${import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN}`
          );
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            setLocationName(data.features[0].place_name);
          }
        } catch (error) {
          console.error("Error getting location name:", error);
        }
        
        setIsCapturingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        setIsCapturingLocation(false);
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
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <Label htmlFor="share-location" className="font-medium">Share Location</Label>
        </div>
        <Switch 
          id="share-location"
          checked={shareLocation}
          onCheckedChange={setShareLocation}
        />
      </div>
      
      {shareLocation && (
        <div className="space-y-4 pl-7">
          <p className="text-sm text-muted-foreground">
            {isCapturingLocation 
              ? "Capturing your current location..." 
              : "Recipients will see your current location when viewing this message."}
          </p>
          
          {locationLatitude && locationLongitude ? (
            <div className="space-y-2">
              <div className="p-3 border rounded-lg bg-background">
                <p className="font-semibold">{locationName || 'Location captured'}</p>
                <p className="text-sm text-muted-foreground">
                  Lat: {locationLatitude.toFixed(6)}, Long: {locationLongitude.toFixed(6)}
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
