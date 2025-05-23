
import { supabaseClient } from "./supabase-client.ts";
import { ReminderData } from "./types/reminder-types.ts";

/**
 * Check for reminders that are due to be processed
 * 
 * @param forceSend Whether to force sending reminders even if not due
 * @param debug Enable debug logging
 * @returns Array of due reminders
 */
export async function checkForDueReminders(
  forceSend: boolean = false,
  debug: boolean = false
): Promise<any[]> {
  const supabase = supabaseClient();
  
  try {
    if (debug) {
      console.log("Checking for due reminders...");
    }
    
    // Use the acquire_due_reminders function to atomically select and mark reminders
    // This function implements FOR UPDATE SKIP LOCKED to prevent concurrent processing
    const { data: dueReminders, error } = await supabase
      .rpc('acquire_due_reminders', {
        max_reminders: 50 // Process up to 50 reminders at a time
      });
    
    if (error) {
      console.error("Error fetching due reminders:", error);
      throw error;
    }
    
    if (debug) {
      console.log(`Found ${dueReminders?.length || 0} due reminders`);
    }
    
    return dueReminders || [];
  } catch (error: any) {
    console.error("Error in checkForDueReminders:", error);
    return [];
  }
}
