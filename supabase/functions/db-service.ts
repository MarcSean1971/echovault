
import { supabaseClient } from "./supabase-client.ts";

/**
 * Ensure the delivered_messages table exists
 * This is a utility function that can be called to make sure the table is ready
 */
export async function ensureDeliveredMessagesTable() {
  try {
    const supabase = supabaseClient();
    
    // Check if the table exists by trying to select from it
    const { error } = await supabase
      .from("delivered_messages")
      .select("count")
      .limit(1);
      
    if (error && error.code === "42P01") {
      console.warn("delivered_messages table doesn't exist yet. The migration may need to be run.");
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error checking for delivered_messages table:", error);
    return false;
  }
}
