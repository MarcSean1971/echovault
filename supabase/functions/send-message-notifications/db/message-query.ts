
import { supabaseClient } from "../supabase-client.ts";
import { Message, Condition } from "../types.ts";

/**
 * Get messages that need notification
 * Enhanced with STRICT deadline validation to prevent premature final delivery
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
  const now = new Date();

  for (const item of data) {
    const condition = item as unknown as Condition;
    const message = item.messages as unknown as Message;

    if (!message) {
      console.log(`Missing message for condition ${condition.id} - skipping`);
      continue;
    }

    // For specific message ID lookups with force send, skip deadline checks
    if (messageId && forceSend) {
      console.log(`Force sending message ${message.id} with condition type ${condition.condition_type}`);
      messagesToNotify.push({ message, condition });
      continue;
    }

    // ENHANCED: Apply strict deadline validation for each condition type
    if (condition.condition_type === 'no_check_in' && condition.last_checked) {
      const lastChecked = new Date(condition.last_checked);
      const hoursThreshold = condition.hours_threshold || 0;
      const minutesThreshold = condition.minutes_threshold || 0;
      const actualDeadline = new Date(lastChecked);
      
      actualDeadline.setHours(actualDeadline.getHours() + hoursThreshold);
      actualDeadline.setMinutes(actualDeadline.getMinutes() + minutesThreshold);
      
      const minutesUntilDeadline = (actualDeadline.getTime() - now.getTime()) / (1000 * 60);
      
      console.log(`[DEADLINE-VALIDATION] Checking no_check_in condition ${condition.id}`);
      console.log(`[DEADLINE-VALIDATION] Last checked: ${lastChecked.toISOString()}, Actual deadline: ${actualDeadline.toISOString()}, Current time: ${now.toISOString()}`);
      console.log(`[DEADLINE-VALIDATION] Minutes until deadline: ${minutesUntilDeadline.toFixed(2)}`);
      
      // CRITICAL: Only notify if we're truly past the actual deadline
      if (now >= actualDeadline) {
        // ADDITIONAL SAFEGUARD: Check for recent check-ins (within last 5 minutes)
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        if (lastChecked > fiveMinutesAgo) {
          console.log(`[DEADLINE-VALIDATION] BLOCKING - Recent check-in detected at ${lastChecked.toISOString()}, not sending notification`);
          continue;
        }
        
        console.log(`[DEADLINE-VALIDATION] APPROVED - Past deadline and no recent check-in, will notify for message ${message.id}`);
        messagesToNotify.push({ message, condition });
      } else {
        console.log(`[DEADLINE-VALIDATION] BLOCKING - Not yet at deadline, ${minutesUntilDeadline.toFixed(2)} minutes remaining`);
      }
    } else if (condition.condition_type === 'recurring_check_in' && condition.next_check) {
      const nextCheck = new Date(condition.next_check);
      
      console.log(`[DEADLINE-VALIDATION] Checking recurring_check_in condition ${condition.id} - next check: ${nextCheck.toISOString()}, now: ${now.toISOString()}`);
      
      if (now >= nextCheck) {
        console.log(`[DEADLINE-VALIDATION] APPROVED - Past check time, will notify for message ${message.id}`);
        messagesToNotify.push({ message, condition });
      } else {
        console.log(`[DEADLINE-VALIDATION] BLOCKING - Not yet at check time`);
      }
    } else if (condition.condition_type === 'specific_date' && condition.trigger_date) {
      const triggerDate = new Date(condition.trigger_date);
      
      console.log(`[DEADLINE-VALIDATION] Checking specific_date condition ${condition.id} - trigger date: ${triggerDate.toISOString()}, now: ${now.toISOString()}`);
      
      if (now >= triggerDate) {
        console.log(`[DEADLINE-VALIDATION] APPROVED - Past trigger date, will notify for message ${message.id}`);
        messagesToNotify.push({ message, condition });
      } else {
        console.log(`[DEADLINE-VALIDATION] BLOCKING - Not yet at trigger date`);
      }
    } else if (condition.condition_type === 'inactivity_to_date' && condition.trigger_date && condition.last_checked) {
      const triggerDate = new Date(condition.trigger_date);
      const lastChecked = new Date(condition.last_checked);
      
      console.log(`[DEADLINE-VALIDATION] Checking inactivity_to_date condition ${condition.id} - trigger date: ${triggerDate.toISOString()}, last checked: ${lastChecked.toISOString()}, now: ${now.toISOString()}`);
      
      if (now >= triggerDate && lastChecked < triggerDate) {
        // ADDITIONAL SAFEGUARD: Check for recent check-ins
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        if (lastChecked > fiveMinutesAgo) {
          console.log(`[DEADLINE-VALIDATION] BLOCKING - Recent check-in detected for inactivity condition`);
          continue;
        }
        
        console.log(`[DEADLINE-VALIDATION] APPROVED - Past trigger date and no check in, will notify for message ${message.id}`);
        messagesToNotify.push({ message, condition });
      } else {
        console.log(`[DEADLINE-VALIDATION] BLOCKING - Not yet at trigger date or user has checked in`);
      }
    } else if (condition.condition_type === 'panic_trigger') {
      // Panic triggers are not automatically processed, must be manually triggered
      console.log(`[DEADLINE-VALIDATION] Skipping panic_trigger condition ${condition.id} - requires manual trigger`);
      continue;
    } else {
      console.log(`[DEADLINE-VALIDATION] Unknown or incomplete condition type: ${condition.condition_type} for condition ${condition.id} - cannot determine notification status`);
    }
  }

  console.log(`[DEADLINE-VALIDATION] Found ${messagesToNotify.length} messages that passed strict deadline validation`);
  return messagesToNotify;
}
