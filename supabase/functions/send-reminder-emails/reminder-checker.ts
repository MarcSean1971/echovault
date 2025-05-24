
import { supabaseClient } from "./supabase-client.ts";

/**
 * Check for due reminders across all messages
 */
export async function checkForDueReminders(
  forceSend: boolean = false,
  debug: boolean = false
): Promise<any[]> {
  try {
    console.log("[REMINDER-CHECKER] Checking for due reminders...");
    
    const supabase = supabaseClient();
    const now = new Date();
    
    // Build the query for due reminders
    let query = supabase
      .from('reminder_schedule')
      .select(`
        id,
        message_id,
        condition_id,
        scheduled_at,
        reminder_type,
        status,
        retry_count,
        last_attempt_at,
        delivery_priority
      `)
      .eq('status', 'pending');
    
    // If not forcing send, only get actually due reminders
    if (!forceSend) {
      query = query.lte('scheduled_at', now.toISOString());
    }
    
    // Order by priority and scheduled time
    query = query.order('delivery_priority', { ascending: false })
                 .order('scheduled_at', { ascending: true });
    
    const { data: dueReminders, error } = await query;
    
    if (error) {
      console.error("[REMINDER-CHECKER] Error fetching due reminders:", error);
      throw error;
    }
    
    console.log(`[REMINDER-CHECKER] Found ${dueReminders?.length || 0} due reminders`);
    
    if (debug && dueReminders) {
      for (const reminder of dueReminders) {
        const timeDiff = (now.getTime() - new Date(reminder.scheduled_at).getTime()) / (1000 * 60);
        console.log(`[REMINDER-CHECKER] Reminder ${reminder.id}: ${timeDiff.toFixed(1)} minutes overdue`);
      }
    }
    
    return dueReminders || [];
    
  } catch (error) {
    console.error("[REMINDER-CHECKER] Error in checkForDueReminders:", error);
    throw error;
  }
}

/**
 * Check for stuck reminders that need to be reset
 */
export async function checkForStuckReminders(): Promise<number> {
  try {
    console.log("[REMINDER-CHECKER] Checking for stuck reminders...");
    
    const supabase = supabaseClient();
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    // Find reminders stuck in processing for more than 5 minutes
    const { data: stuckReminders, error: findError } = await supabase
      .from('reminder_schedule')
      .select('id, message_id, last_attempt_at')
      .eq('status', 'processing')
      .lt('last_attempt_at', fiveMinutesAgo.toISOString());
    
    if (findError) {
      console.error("[REMINDER-CHECKER] Error finding stuck reminders:", findError);
      throw findError;
    }
    
    if (!stuckReminders || stuckReminders.length === 0) {
      return 0;
    }
    
    console.log(`[REMINDER-CHECKER] Found ${stuckReminders.length} stuck reminders, resetting...`);
    
    // Reset stuck reminders to pending
    const { error: resetError } = await supabase
      .from('reminder_schedule')
      .update({
        status: 'pending',
        retry_count: 0,
        last_attempt_at: null,
        updated_at: new Date().toISOString()
      })
      .in('id', stuckReminders.map(r => r.id));
    
    if (resetError) {
      console.error("[REMINDER-CHECKER] Error resetting stuck reminders:", resetError);
      throw resetError;
    }
    
    console.log(`[REMINDER-CHECKER] Successfully reset ${stuckReminders.length} stuck reminders`);
    
    return stuckReminders.length;
    
  } catch (error) {
    console.error("[REMINDER-CHECKER] Error in checkForStuckReminders:", error);
    throw error;
  }
}

/**
 * Get reminder statistics for monitoring
 */
export async function getReminderStats(): Promise<any> {
  try {
    const supabase = supabaseClient();
    
    const { data, error } = await supabase.rpc('get_system_reminder_stats');
    
    if (error) {
      console.error("[REMINDER-CHECKER] Error getting reminder stats:", error);
      return null;
    }
    
    return data?.[0] || null;
    
  } catch (error) {
    console.error("[REMINDER-CHECKER] Error in getReminderStats:", error);
    return null;
  }
}
