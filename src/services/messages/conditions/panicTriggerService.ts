
import { getAuthClient } from "@/lib/supabaseClient";
import { PanicTriggerResult } from "./types";

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
      throw new Error("Message not found or you don't have permission to trigger it");
    }
    
    // Mark the message as triggered - note that we're not updating the DB with 'triggered'
    // and 'delivered' since they don't exist in the schema yet. In a real implementation,
    // these fields would be added to the database.
    const { error: updateError } = await client
      .from("message_conditions")
      .update({ 
        active: false // We use active as a proxy for triggered for now
      })
      .eq("id", data.id);
      
    if (updateError) {
      throw new Error("Failed to trigger panic message");
    }
    
    // Return success
    return {
      success: true,
      message: "Panic message triggered successfully",
      triggered_at: new Date().toISOString()
    };
  } catch (error: any) {
    console.error("Error triggering panic message:", error);
    throw new Error(error.message || "Failed to trigger panic message");
  }
}
