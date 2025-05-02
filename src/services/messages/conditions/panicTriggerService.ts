import { getAuthClient } from "@/lib/supabaseClient";
import { PanicTriggerResult } from "./types";
import { toast } from "@/components/ui/use-toast";
import { triggerMessageNotification } from "@/services/messages/notificationService";

export async function triggerPanicMessage(userId: string, messageId: string): Promise<PanicTriggerResult> {
  const client = await getAuthClient();
  
  try {
    // First, verify the user owns this message and it has a panic trigger
    const { data, error } = await client
      .from("message_conditions")
      .select("*, messages!inner(*)")
      .eq("message_id", messageId)
      .eq("messages.user_id", userId)
      .eq("condition_type", "panic_trigger")
      .eq("active", true)
      .single();
      
    if (error) {
      console.error("Error finding panic message:", error);
      throw new Error("Message not found or you don't have permission to trigger it");
    }
    
    if (!data) {
      throw new Error("No active panic message found with that ID");
    }
    
    console.log("Found panic message to trigger:", data);
    
    // Check if we should keep the message armed after triggering
    const keepArmed = data.panic_config?.keep_armed || false;
    
    if (!keepArmed) {
      // Mark the message as triggered only if we're not keeping it armed
      const { error: updateError } = await client
        .from("message_conditions")
        .update({ 
          active: false // Mark as inactive which means triggered
        })
        .eq("id", data.id);
        
      if (updateError) {
        console.error("Error updating panic message:", updateError);
        throw new Error("Failed to trigger panic message");
      }
    }
    
    // Now trigger the notification service to send the emails
    try {
      console.log("Triggering emergency notifications for message ID:", messageId);
      await triggerMessageNotification(messageId);
    } catch (notifError) {
      console.error("Error sending emergency notifications:", notifError);
      // We don't throw here as we still want to return success for the trigger itself
      // The notification service will show its own toast errors
    }
    
    console.log("Successfully triggered panic message");
    
    // Return success
    return {
      success: true,
      message: "Panic message triggered successfully",
      triggered_at: new Date().toISOString(),
      keepArmed: keepArmed
    };
  } catch (error: any) {
    console.error("Error triggering panic message:", error);
    throw new Error(error.message || "Failed to trigger panic message");
  }
}

/**
 * Check if a user has any configured panic messages
 * @param userId The user ID to check
 * @returns Boolean indicating if panic messages exist
 */
export async function hasActivePanicMessages(userId: string): Promise<boolean> {
  if (!userId) return false;
  
  const client = await getAuthClient();
  
  try {
    const { data, error } = await client
      .from("message_conditions")
      .select("id, messages!inner(user_id)")
      .eq("messages.user_id", userId)
      .eq("condition_type", "panic_trigger")
      .eq("active", true);
      
    if (error) {
      console.error("Error checking for panic messages:", error);
      return false;
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.error("Error in hasActivePanicMessages:", error);
    return false;
  }
}
