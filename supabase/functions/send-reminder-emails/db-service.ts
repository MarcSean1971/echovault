
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
    
    console.log(`DB: Found ${conditions?.length || 0} active conditions with reminder_hours defined`);
    
    const now = new Date();
    console.log(`DB: Current time: ${now.toISOString()}`);
    
    // Process each condition
    for (const condition of conditions || []) {
      console.log(`DB: Processing condition ${condition.id} for message ${condition.message_id}`);
      
      // Skip if no reminder hours
      if (!condition.reminder_hours || condition.reminder_hours.length === 0) {
        console.log(`DB: No reminder hours for condition ${condition.id}, skipping`);
        continue;
      }
      
      // Skip if no trigger_date AND NOT forceSend - this is the key change
      // When forceSend is true, we'll proceed even if trigger_date is null
      if (!condition.trigger_date && !forceSend) {
        console.log(`DB: No trigger_date for condition ${condition.id} and forceSend is not enabled, skipping`);
        continue;
      }
      
      const message = condition.messages;
      
      if (!message) {
        console.log(`DB: No message found for condition ${condition.id}, skipping`);
        continue;
      }
      
      // Calculate hours until deadline or use a default for forced sends
      let hoursUntilDeadline = 24; // Default to 24 hours if no trigger_date for forced sends
      
      if (condition.trigger_date) {
        const deadline = new Date(condition.trigger_date);
        hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
        console.log(`DB: Message ${message.id} has trigger_date ${condition.trigger_date}`);
        console.log(`DB: Hours until deadline: ${hoursUntilDeadline.toFixed(2)}`);
      } else if (forceSend) {
        console.log(`DB: Force sending reminder for message ${message.id} with no trigger_date, using default ${hoursUntilDeadline} hours`);
      }
      
      // Check if any reminder hour matches
      const reminderHours = condition.reminder_hours as number[];
      let shouldSendReminder = false;
      let matchedReminderHour = null;
      
      if (forceSend) {
        // If forceSend is true, always send a reminder
        shouldSendReminder = true;
        console.log(`DB: Force sending reminder for message ${message.id}, deadline in ${condition.trigger_date ? hoursUntilDeadline.toFixed(1) : 'N/A'} hours`);
      } else {
        // Check if the current time matches any reminder window
        // Updated to check within 15 minutes (0.25 hours) to catch reminders in a wider interval
        for (const hour of reminderHours) {
          // Reminder should be sent if current time is within 15 minutes (0.25 hours) of the reminder time
          const difference = Math.abs(hoursUntilDeadline - hour);
          console.log(`DB: Checking reminder hour ${hour}, difference: ${difference.toFixed(2)}`);
          
          if (difference < 0.25) {
            shouldSendReminder = true;
            matchedReminderHour = hour;
            console.log(`DB: Reminder time match for message ${message.id}: ${hour} hours before deadline (difference: ${difference.toFixed(2)} hours)`);
            break;
          }
        }
      }
      
      if (shouldSendReminder) {
        console.log(`DB: Will send reminder for message ${message.id} "${message.title}"`);
        
        // Handle check-in conditions specifically
        if (condition.condition_type === 'recurring_check_in' || 
            condition.condition_type === 'no_check_in' ||
            condition.condition_type === 'inactivity_to_date') {
          console.log(`DB: This is a check-in type condition (${condition.condition_type})`);
          console.log(`DB: For check-in conditions, reminder goes to creator (${message.user_id})`);
        } else if (condition.recipients) {
          console.log(`DB: Recipients count: ${condition.recipients.length}`);
        }
        
        messagesToRemind.push({
          message: message as Message,
          condition: condition as unknown as Condition,
          hoursUntilDeadline: hoursUntilDeadline,
          reminderHours: reminderHours,
          matchedReminderHour: matchedReminderHour
        });
      } else {
        console.log(`DB: No reminder needed for message ${message.id} at this time`);
      }
    }
    
    return messagesToRemind;
  } catch (error) {
    console.error("Error in getMessagesNeedingReminders:", error);
    throw error;
  }
}
