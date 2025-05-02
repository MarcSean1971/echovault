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
    const { data: condition, error: conditionError } = await supabase
      .from("message_conditions")
      .select("id, panic_config")
      .eq("message_id", messageId)
      .eq("condition_type", "panic_trigger")
      .eq("active", true)
      .single();

    if (conditionError) {
      console.error("Error fetching panic condition:", conditionError);
      throw conditionError;
    }

    if (!condition) {
      console.error("No active panic message found");
      throw new Error("No active panic message found");
    }

    console.log("Retrieved condition:", JSON.stringify(condition, null, 2));

    // Extract the keepArmed setting from panic_config
    // Fix the type issue by proper type checking
    let keepArmed = false;
    if (condition.panic_config && typeof condition.panic_config === 'object') {
      keepArmed = Boolean((condition.panic_config as Record<string, unknown>)?.keep_armed);
      console.log(`Keep armed setting: ${keepArmed}`);
    } else {
      console.warn("No panic_config found or invalid format");
    }

    console.log("Invoking edge function to send notifications");
    
    // Trigger the notification via the edge function
    const { data, error } = await supabase.functions.invoke("send-message-notifications", {
      body: { 
        messageId,
        isEmergency: true,
        debug: true // Enable debug mode for emergency messages
      }
    });
    
    if (error) {
      console.error("Edge function error:", error);
      throw error;
    }

    console.log("Edge function response:", data);

    // Update the message condition as triggered
    // But only deactivate if keepArmed is false
    if (!keepArmed) {
      console.log("Deactivating panic trigger as keepArmed=false");
      const { error: updateError } = await supabase
        .from("message_conditions")
        .update({ active: false })
        .eq("id", condition.id);
      
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
