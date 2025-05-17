
/**
 * Functions for fetching reminder data from the database
 */
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Get upcoming reminders for a message
 * Updated to handle potential permission errors from RLS
 */
export async function getUpcomingReminders(messageId: string): Promise<{ 
  scheduledAt: Date, 
  reminderType: string,
  priority?: string 
}[]> {
  try {
    // Only get non-obsolete reminders
    const { data, error } = await supabase
      .from('reminder_schedule')
      .select('scheduled_at, reminder_type, delivery_priority, status')
      .eq('message_id', messageId)
      .eq('status', 'pending')
      .order('scheduled_at', { ascending: true });
    
    if (error) {
      // Handle RLS specific errors
      if (error.code === "42501" || error.message?.includes("permission denied")) {
        console.warn("[REMINDER-FETCHER] Permission denied accessing reminders - user likely doesn't own this message");
        throw new Error(`Permission denied: ${error.message}`);
      } else {
        console.error("[REMINDER-FETCHER] Error fetching upcoming reminders:", error);
        throw error;
      }
    }
    
    if (!data) {
      return [];
    }
    
    console.log(`[REMINDER-FETCHER] Found ${data.length} pending reminders for message ${messageId}`);
    
    // For debugging, log the reminders
    data.forEach((reminder, idx) => {
      console.log(`[REMINDER-FETCHER] Reminder ${idx+1}: ${reminder.reminder_type} at ${reminder.scheduled_at} (status: ${reminder.status})`);
    });
    
    return data.map(item => ({
      scheduledAt: new Date(item.scheduled_at),
      reminderType: item.reminder_type,
      priority: item.delivery_priority || 'normal'
    }));
  } catch (error) {
    console.error("[REMINDER-FETCHER] Error in getUpcomingReminders:", error);
    throw error; // Re-throw to allow proper handling by callers
  }
}

/**
 * Get upcoming reminders for multiple messages in a single batch query
 * This eliminates the N+1 query pattern by fetching all reminders at once
 */
export async function getUpcomingRemindersForMultipleMessages(messageIds: string[]): Promise<
  Record<string, { scheduledAt: Date, reminderType: string, priority?: string }[]>
> {
  if (!messageIds || messageIds.length === 0) {
    return {};
  }
  
  try {
    console.log(`[REMINDER-FETCHER] Batch fetching reminders for ${messageIds.length} messages`);
    
    // Only get non-obsolete reminders
    const { data, error } = await supabase
      .from('reminder_schedule')
      .select('message_id, scheduled_at, reminder_type, delivery_priority, status')
      .in('message_id', messageIds)
      .eq('status', 'pending')
      .order('scheduled_at', { ascending: true });
    
    if (error) {
      console.error("[REMINDER-FETCHER] Error batch fetching reminders:", error);
      return {};
    }
    
    if (!data || data.length === 0) {
      console.log("[REMINDER-FETCHER] No reminders found in batch query");
      return {};
    }
    
    console.log(`[REMINDER-FETCHER] Found ${data.length} pending reminders across ${messageIds.length} messages`);
    
    // Group reminders by message_id
    const remindersByMessage: Record<string, { scheduledAt: Date, reminderType: string, priority?: string }[]> = {};
    
    // Initialize all message IDs with empty arrays (so we return data for all messages, even those with no reminders)
    messageIds.forEach(id => {
      remindersByMessage[id] = [];
    });
    
    // Populate with actual reminders
    data.forEach(item => {
      if (!remindersByMessage[item.message_id]) {
        remindersByMessage[item.message_id] = [];
      }
      
      remindersByMessage[item.message_id].push({
        scheduledAt: new Date(item.scheduled_at),
        reminderType: item.reminder_type,
        priority: item.delivery_priority || 'normal'
      });
    });
    
    return remindersByMessage;
  } catch (error) {
    console.error("[REMINDER-FETCHER] Error in getUpcomingRemindersForMultipleMessages:", error);
    return {};
  }
}
