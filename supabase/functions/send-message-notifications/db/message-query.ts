import { supabaseClient } from "../supabase-client.ts";
import { Message, Condition } from "../types.ts";

/**
 * Get messages that need notification
 * Enhanced to handle forced sending and specific message IDs
 */
export async function getMessagesToNotify(
  messageId?: string,
  forceSend: boolean = false
): Promise<Array<{message: Message, condition: Condition}>> {
  const supabase = supabaseClient();
  let query = supabase.from('message_conditions').select(`
    *,
    messages:message_id (*)
  `);

  if (messageId) {
    // If a specific message ID is provided, look only for that message
    query = query.eq('message_id', messageId);
    
    // If force send is enabled, don't filter by active status
    if (!forceSend) {
      query = query.eq('active', true);
    }
  } else {
    // Otherwise, filter for active conditions only
    query = query.eq('active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching message conditions:", error.message);
    return [];
  }

  if (!data || data.length === 0) {
    console.log(`Found 0 messages to notify out of ${messageId ? '1 requested' : 'all active conditions'}`);
    return [];
  }

  const messagesToNotify: Array<{message: Message, condition: Condition}> = [];

  for (const item of data) {
    const condition = item as unknown as Condition;
    const message = item.messages as unknown as Message;

    if (!message) {
      console.log(`Missing message for condition ${condition.id} - skipping`);
      continue;
    }

    // For specific message ID lookups with force send, skip other checks
    if (messageId && forceSend) {
      console.log(`Force sending message ${message.id} with condition type ${condition.condition_type}`);
      messagesToNotify.push({ message, condition });
      continue;
    }

    // Check different condition types
    if (condition.condition_type === 'no_check_in' && condition.last_checked) {
      const lastChecked = new Date(condition.last_checked);
      const hoursThreshold = condition.hours_threshold || 0;
      const minutesThreshold = condition.minutes_threshold || 0;
      const deadline = new Date(lastChecked);
      
      deadline.setHours(deadline.getHours() + hoursThreshold);
      deadline.setMinutes(deadline.getMinutes() + minutesThreshold);
      
      const now = new Date();
      const minutesUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60);
      
      console.log(`Checking no_check_in condition ${condition.id} - deadline: ${deadline.toISOString()}, now: ${now.toISOString()}`);
      console.log(`Time until deadline: ${minutesUntilDeadline} minutes`);
      
      // Only notify if we're past the deadline
      if (now >= deadline) {
        console.log(`PAST DEADLINE - Will notify for message ${message.id}`);
        messagesToNotify.push({ message, condition });
      } else {
        console.log(`Not yet at deadline - ${minutesUntilDeadline.toFixed(2)} minutes remaining`);
      }
    } else if (condition.condition_type === 'recurring_check_in' && condition.next_check) {
      const nextCheck = new Date(condition.next_check);
      const now = new Date();
      
      console.log(`Checking recurring_check_in condition ${condition.id} - next check: ${nextCheck.toISOString()}, now: ${now.toISOString()}`);
      
      if (now >= nextCheck) {
        console.log(`PAST CHECK TIME - Will notify for message ${message.id}`);
        messagesToNotify.push({ message, condition });
      }
    } else if (condition.condition_type === 'specific_date' && condition.trigger_date) {
      const triggerDate = new Date(condition.trigger_date);
      const now = new Date();
      
      console.log(`Checking specific_date condition ${condition.id} - trigger date: ${triggerDate.toISOString()}, now: ${now.toISOString()}`);
      
      if (now >= triggerDate) {
        console.log(`PAST TRIGGER DATE - Will notify for message ${message.id}`);
        messagesToNotify.push({ message, condition });
      }
    } else if (condition.condition_type === 'inactivity_to_date' && condition.trigger_date && condition.last_checked) {
      const triggerDate = new Date(condition.trigger_date);
      const lastChecked = new Date(condition.last_checked);
      const now = new Date();
      
      console.log(`Checking inactivity_to_date condition ${condition.id} - trigger date: ${triggerDate.toISOString()}, last checked: ${lastChecked.toISOString()}, now: ${now.toISOString()}`);
      
      if (now >= triggerDate && lastChecked < triggerDate) {
        console.log(`PAST TRIGGER DATE AND NO CHECK IN - Will notify for message ${message.id}`);
        messagesToNotify.push({ message, condition });
      }
    } else if (condition.condition_type === 'panic_trigger') {
      // Panic triggers are not automatically processed, must be manually triggered
      console.log(`Skipping panic_trigger condition ${condition.id} - requires manual trigger`);
      continue;
    } else {
      console.log(`Unknown or incomplete condition type: ${condition.condition_type} for condition ${condition.id} - cannot determine notification status`);
    }
  }

  console.log(`Found ${messagesToNotify.length} messages to notify`);
  return messagesToNotify;
}
