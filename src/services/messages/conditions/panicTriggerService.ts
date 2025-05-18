import { supabase } from "@/integrations/supabase/client";
import { PanicTriggerResult } from "./types";
import { toast } from "@/components/ui/use-toast";
import { getCurrentLocation } from "@/services/location/mapboxService";
import { getConditionByMessageId } from "./operations/get-operations";

/**
 * Check if a user has any active panic messages
 */
export async function hasActivePanicMessages(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("message_conditions")
      .select("id")
      .eq("condition_type", "panic_trigger")
      .eq("active", true)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is the "no rows returned" error, which is expected if no panic messages
      console.error("Error checking for active panic messages:", error);
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error("Error in hasActivePanicMessages:", error);
    return false;
  }
}

/**
 * Update message with current location info before sending
 */
async function updateMessageWithLocation(messageId: string): Promise<boolean> {
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

/**
 * Trigger a panic message with fallback mechanisms
 */
export async function triggerPanicMessage(userId: string, messageId: string): Promise<PanicTriggerResult> {
  try {
    console.log(`Triggering panic message for message ID: ${messageId}`);
    
    // First, get the message condition to check its configuration
    const { data, error } = await supabase
      .from("message_conditions")
      .select("id, message_id, panic_config")
      .eq("message_id", messageId)
      .eq("condition_type", "panic_trigger")
      .eq("active", true)
      .single();

    if (error) {
      console.error("Error fetching panic condition:", error);
      throw error;
    }

    if (!data) {
      console.error("No active panic message found");
      throw new Error("No active panic message found");
    }

    console.log("Retrieved condition:", JSON.stringify(data, null, 2));

    // Extract the keepArmed setting from panic_config
    let keepArmed = true; // Default to true for safety
    
    // Properly check panic_config and extract keep_armed value if it exists
    if (data.panic_config && typeof data.panic_config === 'object' && !Array.isArray(data.panic_config)) {
      // Type narrowing to ensure we're dealing with an object, not an array
      const panicConfig = data.panic_config as Record<string, any>;
      
      // Now safely check if keep_armed exists and is false
      if (panicConfig.keep_armed === false) {
        keepArmed = false;
      }
      console.log(`Keep armed setting from panic_config: ${keepArmed}`);
    } else {
      console.warn("No panic_config found or invalid format, defaulting keepArmed to true");
    }
    
    // Update the message with current location before sending
    await updateMessageWithLocation(messageId);

    console.log("Invoking edge function to send notifications");
    
    // Try using the edge function first
    try {
      // Trigger the notification via the edge function
      const { data: funcData, error: funcError } = await supabase.functions.invoke("send-message-notifications", {
        body: { 
          messageId,
          isEmergency: true,
          debug: true, // Enable debug mode for emergency messages
          keepArmed, // Pass keepArmed flag explicitly to edge function
          forceSend: true // Force send even if conditions don't match
        }
      });
      
      if (funcError) {
        console.error("Edge function error:", funcError);
        throw funcError;
      }

      console.log("Edge function response:", funcData);
      
      // Check if the response indicates no messages were found
      if (funcData && !funcData.success && funcData.error === "No messages found to notify") {
        console.warn("Edge function returned no messages found. Trying fallback mechanism...");
        throw new Error("No messages found, attempting fallback");
      }
    } catch (edgeFuncError) {
      console.error("Edge function failed, attempting alternative fallback:", edgeFuncError);
      
      // Fallback: Directly use the sent_reminders table
      const { data: directData, error: directError } = await supabase
        .from("sent_reminders")
        .insert({
          message_id: messageId,
          condition_id: data.id,  // Using the condition ID we fetched earlier
          user_id: userId,
          deadline: new Date().toISOString()
        });
      
      if (directError) {
        console.error("Direct fallback insertion failed:", directError);
        throw directError;
      }
      
      console.log("Created emergency fallback record:", directData);
      
      // Create a reminder delivery log entry to track this
      try {
        await supabase
          .from("reminder_delivery_log")
          .insert({
            reminder_id: `manual-emergency-${Date.now()}`,
            message_id: messageId,
            condition_id: data.id,
            recipient: 'emergency-fallback',
            delivery_channel: 'fallback',
            delivery_status: 'pending',
            response_data: {
              emergency: true,
              triggered_by: userId,
              triggered_at: new Date().toISOString(),
              manual_trigger: true,
              keep_armed: keepArmed,
              fallback_method: true
            }
          });
      } catch (logError) {
        console.warn("Could not create log entry, but continuing with emergency protocol:", logError);
      }
    }

    // Update the message condition as triggered
    // But only deactivate if keepArmed is false
    if (!keepArmed) {
      console.log("Deactivating panic trigger as keepArmed=false");
      const { error: updateError } = await supabase
        .from("message_conditions")
        .update({ active: false })
        .eq("id", data.id);
      
      if (updateError) {
        console.error("Error deactivating condition:", updateError);
      }
    } else {
      console.log("Keeping panic trigger armed as requested by user (keepArmed=true)");
    }

    // Return success with the keepArmed flag
    return {
      success: true,
      message: "Emergency message triggered successfully",
      triggered_at: new Date().toISOString(),
      keepArmed
    };

  } catch (error: any) {
    console.error("Error triggering panic message:", error);
    toast({
      title: "Error",
      description: error.message || "Failed to trigger panic message",
      variant: "destructive"
    });
    throw error;
  }
}

// Make updateMessageWithLocation available for direct use
export { updateMessageWithLocation };
