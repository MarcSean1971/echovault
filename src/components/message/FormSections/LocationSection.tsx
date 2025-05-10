
import { useState, useCallback } from "react";
import { useMessageForm } from "../MessageFormContext";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2 } from "lucide-react";
import { BUTTON_HOVER_EFFECTS, HOVER_TRANSITION } from "@/utils/hoverEffects";
import { Input } from "@/components/ui/input";

export function LocationSection() {
  const { 
    shareLocation, 
    setShareLocation,
    locationLatitude,
    setLocationLatitude,
    locationLongitude,
    setLocationLongitude,
    locationName,
    setLocationName
  } = useMessageForm();
  
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Function to get current location
  const getCurrentLocation = useCallback(async () => {
    setIsLoadingLocation(true);
    setLocationError(null);
    
    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by your browser");
      }
      
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      
      const { latitude, longitude } = position.coords;
      
      // Set location state
      setLocationLatitude(latitude);
      setLocationLongitude(longitude);
      
      // Try to get location name using reverse geocoding
      try {
        // Simple reverse geocoding using Nominatim (OpenStreetMap)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          { headers: { 'Accept-Language': 'en' } }
        );
        
        if (!response.ok) {
          throw new Error('Geocoding request failed');
        }
        
        const data = await response.json();
        let locationNameValue = '';
        
        // Extract meaningful location info
        if (data.address) {
          const { road, suburb, city, town, village, state, country } = data.address;
          locationNameValue = [
            road,
            suburb,
            city || town || village,
            state,
            country
          ].filter(Boolean).slice(0, 2).join(', ');
        }
        
        // If we couldn't get a good location name, use coordinates
        if (!locationNameValue) {
          locationNameValue = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        }
        
        setLocationName(locationNameValue);
      } catch (error) {
        // If geocoding fails, just use coordinates
        console.error("Error getting location name:", error);
        setLocationName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }
    } catch (error: any) {
      console.error("Error getting location:", error);
      setLocationError(error.message || "Failed to get your location");
      // Reset location data on error
      setLocationLatitude(null);
      setLocationLongitude(null);
      setLocationName("");
    } finally {
      setIsLoadingLocation(false);
    }
  }, [setLocationLatitude, setLocationLongitude, setLocationName]);

  // Handle toggle of location sharing
  const handleToggleLocation = async (checked: boolean) => {
    setShareLocation(checked);
    
    // If turning on location and we don't have location data yet, get it
    if (checked && !locationLatitude && !locationLongitude) {
      await getCurrentLocation();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="shareLocation">Share Location</Label>
          <p className="text-xs text-muted-foreground">
            Include your current location with this message
          </p>
        </div>
        <Switch
          id="shareLocation"
          checked={shareLocation}
          onCheckedChange={handleToggleLocation}
        />
      </div>
      
      {shareLocation && (
        <div className="space-y-4 pt-2 pl-2 border-l-2 border-primary/40">
          {(locationLatitude && locationLongitude) ? (
            <div className="space-y-2">
              <Label htmlFor="locationName">Location Name</Label>
              <Input 
                id="locationName"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Enter location name"
              />
              <p className="text-xs text-muted-foreground">
                Coordinates: {locationLatitude.toFixed(6)}, {locationLongitude.toFixed(6)}
              </p>
            </div>
          ) : (
            <Button
              type="button"
              variant="default" 
              onClick={getCurrentLocation}
              disabled={isLoadingLocation}
              className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
            >
              {isLoadingLocation ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Getting Location...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  Get Current Location
                </>
              )}
            </Button>
          )}
          
          {locationError && (
            <p className="text-xs text-red-500">
              {locationError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
