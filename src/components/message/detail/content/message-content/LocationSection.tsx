
import React from "react";
import { LocationDisplay } from "../LocationDisplay";
import { Separator } from "@/components/ui/separator";

interface LocationSectionProps {
  latitude: number;
  longitude: number;
  locationName: string | null;
}

export function LocationSection({ 
  latitude, 
  longitude, 
  locationName 
}: LocationSectionProps) {
  return (
    <div className="mt-6">
      <Separator className="my-4" />
      <LocationDisplay 
        latitude={latitude} 
        longitude={longitude}
        locationName={locationName}
      />
    </div>
  );
}
