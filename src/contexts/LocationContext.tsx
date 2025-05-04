
import { createContext, useState, useContext, ReactNode } from "react";

interface LocationContextType {
  latitude: number | null;
  longitude: number | null;
  locationName: string | null;
  updateLocation: (lat: number, lng: number, name?: string) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);

  const updateLocation = (lat: number, lng: number, name?: string) => {
    setLatitude(lat);
    setLongitude(lng);
    if (name) setLocationName(name);
  };

  return (
    <LocationContext.Provider value={{ latitude, longitude, locationName, updateLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
};
