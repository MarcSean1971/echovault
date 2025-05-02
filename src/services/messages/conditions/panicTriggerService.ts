import { supabase } from "@/integrations/supabase/client";
import { PanicTriggerResult } from "./types";
import { toast } from "@/components/ui/use-toast";

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
 * Trigger a panic message
 */
export async function triggerPanicMessage(userId: string, messageId: string): Promise<PanicTriggerResult> {
  try {
    console.log(`Triggering panic message for message ID: ${messageId}`);
    
    // First, get the message condition to check its configuration
    const { data, error } = await supabase
      .from("message_conditions")
      .select("id, panic_config")
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
    
    // Check panic_config and extract keep_armed value if it exists
    if (data.panic_config && typeof data.panic_config === 'object') {
      // Explicitly check if keep_armed exists and is false
      if (data.panic_config.keep_armed === false) {
        keepArmed = false;
      }
      console.log(`Keep armed setting from panic_config: ${keepArmed}`);
    } else {
      console.warn("No panic_config found or invalid format, defaulting keepArmed to true");
    }

    console.log("Invoking edge function to send notifications");
    
    // Trigger the notification via the edge function
    const { data: funcData, error: funcError } = await supabase.functions.invoke("send-message-notifications", {
      body: { 
        messageId,
        isEmergency: true,
        debug: true, // Enable debug mode for emergency messages
        keepArmed // Pass keepArmed flag explicitly to edge function
      }
    });
    
    if (funcError) {
      console.error("Edge function error:", funcError);
      throw funcError;
    }

    console.log("Edge function response:", funcData);

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
