
import { getCurrentLocation } from "@/services/location/mapboxService";
import { supabase } from "@/integrations/supabase/client";

/**
 * Update message with current location info before sending
 */
export async function updateMessageWithLocation(messageId: string): Promise<boolean> {
  try {
    // Get user's current location
    const locationData = await getCurrentLocation();
    
    if (!locationData) {
      console.warn("Could not get current location for panic message");
      return false;
    }
    
    console.log("Got current location:", locationData);
    
    // Update the message with current location
    const { error } = await supabase
      .from("messages")
      .update({
        share_location: true,
        location_latitude: locationData.latitude,
        location_longitude: locationData.longitude,
        location_name: locationData.address || `${locationData.latitude}, ${locationData.longitude}`
      })
      .eq("id", messageId);
      
    if (error) {
      console.error("Failed to update message with location:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error updating message with location:", error);
    return false;
  }
}
