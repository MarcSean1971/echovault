
import { supabaseClient } from "./supabase-client.ts";
import { ReminderData } from "./types/reminder-types.ts";

interface Message {
  id: string;
  title: string;
  content: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  message_type: string;
  // Add other message fields as needed
}

interface Condition {
  id: string;
  message_id: string;
  active: boolean;
  condition_type: string;
  recipients: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
  }>;
  trigger_date?: string; // Changed from deadline to trigger_date
  reminder_hours?: number[];
  // Add other condition fields as needed
}

/**
 * Get messages that need reminders
 */
export async function getMessagesNeedingReminders(
  specificMessageId?: string, 
  forceSend: boolean = false
): Promise<ReminderData[]> {
  try {
    const supabase = supabaseClient();
    const messagesToRemind: ReminderData[] = [];
    
    // Query conditions that are active and have reminders configured
    let query = supabase
      .from('message_conditions')
      .select(`
        id,
        message_id,
        active,
        condition_type,
        recipients,
        trigger_date, 
        reminder_hours,
        panic_config,
        messages (
          id,
          title,
          content,
          message_type,
          user_id,
          created_at,
          updated_at
        )
      `)
      .eq('active', true)
      .not('reminder_hours', 'is', null);
    
    // If specificMessageId is provided, add that filter
    if (specificMessageId) {
      query = query.eq('message_id', specificMessageId);
    }
    
    const { data: conditions, error } = await query;
    
    if (error) {
      console.error("Error fetching conditions for reminders:", error);
      throw error;
    }
    
    const now = new Date();
    
    // Process each condition
    for (const condition of conditions || []) {
      // Skip if no reminder hours
      if (!condition.reminder_hours || condition.reminder_hours.length === 0) {
        continue;
      }
      
      // Skip if no trigger_date AND NOT forceSend - this is the key change
      // When forceSend is true, we'll proceed even if trigger_date is null
      if (!condition.trigger_date && !forceSend) {
        console.log(`No trigger_date for condition ${condition.id} and forceSend is not enabled, skipping`);
        continue;
      }
      
      const message = condition.messages;
      
      if (!message) {
        console.log(`No message found for condition ${condition.id}`);
        continue;
      }
      
      // Calculate hours until deadline or use a default for forced sends
      let hoursUntilDeadline = 24; // Default to 24 hours if no trigger_date for forced sends
      
      if (condition.trigger_date) {
        const deadline = new Date(condition.trigger_date);
        hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
      } else if (forceSend) {
        console.log(`Force sending reminder for message ${message.id} with no trigger_date, using default 24 hours`);
      }
      
      // Check if any reminder hour matches
      const reminderHours = condition.reminder_hours as number[];
      let shouldSendReminder = false;
      
      if (forceSend) {
        // If forceSend is true, always send a reminder
        shouldSendReminder = true;
        console.log(`Force sending reminder for message ${message.id}, deadline in ${condition.trigger_date ? hoursUntilDeadline.toFixed(1) : 'N/A'} hours`);
      } else {
        // Check if the current time matches any reminder window
        // Updated to check within 7.5 minutes (0.125 hours) to catch reminders in a 15-minute interval
        for (const hour of reminderHours) {
          // Reminder should be sent if current time is within 7.5 minutes (0.125 hours) of the reminder time
          if (Math.abs(hoursUntilDeadline - hour) < 0.125) {
            shouldSendReminder = true;
            console.log(`Reminder time match for message ${message.id}: ${hour} hours before deadline`);
            break;
          }
        }
      }
      
      if (shouldSendReminder) {
        messagesToRemind.push({
          message: message as Message,
          condition: condition as unknown as Condition,
          hoursUntilDeadline: hoursUntilDeadline,
          reminderHours: reminderHours
        });
      }
    }
    
    return messagesToRemind;
  } catch (error) {
    console.error("Error in getMessagesNeedingReminders:", error);
    throw error;
  }
}
