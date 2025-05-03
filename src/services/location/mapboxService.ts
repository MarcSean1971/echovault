
import { supabase } from "@/integrations/supabase/client";

/**
 * Get the Mapbox access token from Supabase Edge Function secrets
 */
export async function getMapboxToken(): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke("get-mapbox-token", {
      body: {}
    });
    
    if (error) {
      console.error("Error fetching Mapbox token:", error);
      throw error;
    }
    
    return data.token || "";
  } catch (error) {
    console.error("Failed to get Mapbox token:", error);
    throw error;
  }
}

/**
 * Reverse geocode coordinates to get a human-readable address
 */
export async function reverseGeocode(
  latitude: number, 
  longitude: number
): Promise<string | null> {
  try {
    const token = await getMapboxToken();
    const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}&types=address,place,neighborhood,locality&limit=1`;
    
    const response = await fetch(endpoint);
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      return data.features[0].place_name;
    }
    
    return null;
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return null;
  }
}

/**
 * Get current user location using browser API
 */
export async function getCurrentLocation(): Promise<{
  latitude: number;
  longitude: number;
  address: string | null;
} | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser");
      resolve(null);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Get the address from coordinates
        let address = null;
        try {
          address = await reverseGeocode(latitude, longitude);
        } catch (err) {
          console.error("Could not get address from coordinates:", err);
        }
        
        resolve({
          latitude,
          longitude,
          address
        });
      },
      (error) => {
        console.error("Error getting location:", error.message);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}
