
import { supabaseClient } from "./supabase-client.ts";

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

interface MessageToRemind {
  message: Message;
  condition: Condition;
  hoursUntilDeadline: number;
  reminderHours: number[];
}

/**
 * Get messages that need reminders
 */
export async function getMessagesNeedingReminders(
  specificMessageId?: string, 
  forceSend: boolean = false
): Promise<MessageToRemind[]> {
  try {
    const supabase = supabaseClient();
    const messagesToRemind: MessageToRemind[] = [];
    
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
      // Skip if no trigger_date or no reminder hours
      if (!condition.trigger_date || !condition.reminder_hours || condition.reminder_hours.length === 0) {
        continue;
      }
      
      const deadline = new Date(condition.trigger_date);
      const message = condition.messages;
      
      if (!message) {
        console.log(`No message found for condition ${condition.id}`);
        continue;
      }
      
      // Calculate hours until deadline
      const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      // Check if any reminder hour matches
      const reminderHours = condition.reminder_hours as number[];
      let shouldSendReminder = false;
      
      if (forceSend) {
        // If forceSend is true, always send a reminder
        shouldSendReminder = true;
        console.log(`Force sending reminder for message ${message.id}, deadline in ${hoursUntilDeadline.toFixed(1)} hours`);
      } else {
        // Check if the current time matches any reminder window (within 5 minutes)
        for (const hour of reminderHours) {
          // Reminder should be sent if current time is within 5 minutes (0.0833 hours) of the reminder time
          if (Math.abs(hoursUntilDeadline - hour) < 0.0833) {
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

/**
 * Record that a reminder was sent
 */
export async function recordReminderSent(
  messageId: string,
  conditionId: string,
  triggerDate: string, // Changed from deadline to triggerDate
  userId: string
): Promise<boolean> {
  try {
    const supabase = supabaseClient();
    
    // Log the params for debugging
    console.log(`Recording reminder for message ${messageId}, condition ${conditionId}, userId ${userId}`);
    
    const { error } = await supabase
      .from('sent_reminders')
      .insert({
        message_id: messageId,
        condition_id: conditionId,
        user_id: userId,
        deadline: triggerDate, // Keep the column name 'deadline' in the database
        sent_at: new Date().toISOString()
      });
    
    if (error) {
      console.error("Error recording reminder:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in recordReminderSent:", error);
    return false;
  }
}
