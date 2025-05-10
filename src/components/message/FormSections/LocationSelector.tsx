
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useMessageForm } from '../MessageFormContext';
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

export function LocationSelector() {
  const { 
    locationLatitude, 
    setLocationLatitude,
    locationLongitude, 
    setLocationLongitude,
    locationName,
    setLocationName
  } = useMessageForm();

  const [localLatitude, setLocalLatitude] = useState(locationLatitude?.toString() || '');
  const [localLongitude, setLocalLongitude] = useState(locationLongitude?.toString() || '');

  // Update form context when local values change
  useEffect(() => {
    const lat = parseFloat(localLatitude);
    const lng = parseFloat(localLongitude);
    
    if (!isNaN(lat)) {
      setLocationLatitude(lat);
    } else {
      setLocationLatitude(null);
    }
    
    if (!isNaN(lng)) {
      setLocationLongitude(lng);
    } else {
      setLocationLongitude(null);
    }
  }, [localLatitude, localLongitude, setLocationLatitude, setLocationLongitude]);

  return (
    <Card className="mt-4">
      <CardContent className="pt-4 space-y-4">
        <div>
          <Label htmlFor="location-name">Location Name</Label>
          <Input
            id="location-name"
            placeholder="e.g. Home, Office, etc."
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            className={`${HOVER_TRANSITION}`}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              placeholder="e.g. 37.7749"
              value={localLatitude}
              onChange={(e) => setLocalLatitude(e.target.value)}
              className={`${HOVER_TRANSITION}`}
            />
          </div>
          
          <div>
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              placeholder="e.g. -122.4194"
              value={localLongitude}
              onChange={(e) => setLocalLongitude(e.target.value)}
              className={`${HOVER_TRANSITION}`}
            />
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground">
          You can find coordinates using online map services or your device's location.
        </p>
      </CardContent>
    </Card>
  );
}
