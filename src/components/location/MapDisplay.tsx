
import { useEffect, useRef, useState } from "react";
import { getMapboxToken } from "@/services/location/mapboxService";
import { Loader2 } from "lucide-react";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapDisplayProps {
  latitude: number;
  longitude: number;
  locationName?: string | null;
  height?: string;
  width?: string;
}

export function MapDisplay({
  latitude,
  longitude,
  locationName,
  height = "250px",
  width = "100%"
}: MapDisplayProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    
    const initializeMap = async () => {
      try {
        if (!mapContainer.current) return;
        
        // Get Mapbox token from Edge Function
        const token = await getMapboxToken();
        if (!token) throw new Error("Could not retrieve Mapbox access token");
        
        // Set the access token
        mapboxgl.accessToken = token;
        
        // Create new map instance
        const newMap = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [longitude, latitude],
          zoom: 14
        });
        
        // Add navigation controls
        newMap.addControl(
          new mapboxgl.NavigationControl({ showCompass: false }),
          'top-right'
        );
        
        // Add marker at the location
        const marker = new mapboxgl.Marker({ color: '#f44336' })
          .setLngLat([longitude, latitude])
          .addTo(newMap);
          
        // Add popup with location name if available
        if (locationName) {
          const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
            .setLngLat([longitude, latitude])
            .setHTML(`<div><strong>${locationName}</strong></div>`);
            
          marker.setPopup(popup);
          popup.addTo(newMap);
        }
        
        // Save the map instance
        map.current = newMap;
        
        // Map loaded event
        newMap.on('load', () => {
          if (isMounted) setLoading(false);
        });
        
      } catch (err) {
        console.error("Error initializing map:", err);
        if (isMounted) {
          setError("Could not load map");
          setLoading(false);
        }
      }
    };
    
    initializeMap();
    
    return () => {
      isMounted = false;
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [latitude, longitude, locationName]);
  
  return (
    <div className="relative rounded-md overflow-hidden border" style={{ height, width }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
          <div className="text-red-500 text-sm">{error}</div>
        </div>
      )}
      
      <div ref={mapContainer} className="h-full w-full" />
      
      {/* Add attribution for Mapbox */}
      <div className="absolute bottom-0 right-0 text-xs p-1 bg-white/80 text-gray-600">
        © Mapbox © OpenStreetMap
      </div>
    </div>
  );
}

export default MapDisplay;
