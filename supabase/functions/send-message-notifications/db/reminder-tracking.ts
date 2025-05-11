
import { supabaseClient } from "../supabase-client.ts";

/**
 * Track message notification in the database
 */
export async function trackMessageNotification(messageId: string, conditionId: string) {
  try {
    const supabase = supabaseClient();
    
    // We can't set 'triggered' directly because it doesn't exist in the database schema
    // So we'll update any relevant fields we can
    const { error } = await supabase
      .from("message_conditions")
      .update({
        last_checked: new Date().toISOString() // Update last_checked timestamp
      })
      .eq("id", conditionId);
    
    if (error) {
      console.error("Error tracking message notification:", error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error("Error in trackMessageNotification:", error);
    throw error;
  }
}
