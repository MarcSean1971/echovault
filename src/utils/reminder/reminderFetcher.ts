
/**
 * Utilities for fetching reminder data from the database
 * Optimized to use our new indexes
 */
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches upcoming reminders for multiple messages in a single batch query
 * This is an optimized version that eliminates N+1 query problems
 */
export async function getUpcomingRemindersForMultipleMessages(
  messageIds: string[]
): Promise<Record<string, Array<{ 
  scheduledAt: Date, 
  reminderType: string,
  priority?: string
}>>> {
  // Return early if no message IDs provided
  if (!messageIds || messageIds.length === 0) {
    return {};
  }
  
  try {
    console.log(`[REMINDER-FETCHER] Fetching reminders for ${messageIds.length} messages in batch`);
    
    // Query reminders for all message IDs in a single request
    // Use our new index on message_id+status for better performance
    const { data, error } = await supabase
      .from('reminder_schedule')
      .select('*')
      .in('message_id', messageIds)
      .eq('status', 'pending') // This uses our new compound index
      .order('scheduled_at', { ascending: true });
    
    if (error) {
      console.error('[REMINDER-FETCHER] Error fetching batch reminders:', error);
      throw error;
    }
    
    // Group reminders by message ID
    const remindersByMessage: Record<string, Array<{
      scheduledAt: Date,
      reminderType: string,
      priority?: string
    }>> = {};
    
    // Initialize empty arrays for all message IDs
    messageIds.forEach(id => {
      remindersByMessage[id] = [];
    });
    
    // Process and group reminders
    if (data && data.length > 0) {
      data.forEach(reminder => {
        const messageId = reminder.message_id;
        
        // Convert to the expected format
        const formattedReminder = {
          scheduledAt: new Date(reminder.scheduled_at),
          reminderType: reminder.reminder_type,
          priority: reminder.delivery_priority
        };
        
        // Add to the appropriate message's array
        if (remindersByMessage[messageId]) {
          remindersByMessage[messageId].push(formattedReminder);
        }
      });
      
      // Sort each message's reminders by scheduled_at
      Object.keys(remindersByMessage).forEach(messageId => {
        remindersByMessage[messageId].sort(
          (a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()
        );
      });
    }
    
    console.log(`[REMINDER-FETCHER] Found reminders for ${Object.keys(remindersByMessage).filter(id => 
      remindersByMessage[id].length > 0).length} out of ${messageIds.length} messages`);
    
    return remindersByMessage;
  } catch (error) {
    console.error('[REMINDER-FETCHER] Error in getUpcomingRemindersForMultipleMessages:', error);
    // Return empty object on error
    return {};
  }
}
