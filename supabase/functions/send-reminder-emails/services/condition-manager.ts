
/**
 * Service for managing condition status and state
 */
import { supabaseClient } from "../supabase-client.ts";
import { ConditionData } from "../types/reminder-types.ts";
import { logDeliveryError } from "./data-fetcher.ts";

/**
 * Update condition status after processing
 */
export async function updateConditionStatus(
  conditionId: string, 
  keepActive: boolean,
  debug: boolean = false
): Promise<void> {
  try {
    if (!keepActive) {
      const supabase = supabaseClient();
      await supabase
        .from('message_conditions')
        .update({ active: false })
        .eq('id', conditionId);
        
      if (debug) console.log(`Deactivated condition ${conditionId} after final delivery`);
    } else {
      if (debug) console.log(`Keeping condition ${conditionId} active (keep_armed=true)`);
    }
  } catch (statusError) {
    console.error("Error updating condition status after final delivery:", statusError);
  }
}

/**
 * Track reminder delivery in sent_reminders table (for backward compatibility)
 */
export async function trackInSentReminders(
  messageId: string,
  conditionId: string,
  userId: string,
  deadline: string,
  scheduledFor: string = deadline
): Promise<void> {
  try {
    const supabase = supabaseClient();
    await supabase.from('sent_reminders').insert({
      message_id: messageId,
      condition_id: conditionId,
      user_id: userId,
      deadline: deadline,
      scheduled_for: scheduledFor
    });
  } catch (trackError) {
    console.warn("Error tracking reminder in sent_reminders:", trackError);
    // Continue despite tracking error - non-fatal
  }
}

/**
 * Log the delivery attempt in the delivery log
 */
export async function logDeliveryAttempt(
  reminderId: string,
  messageId: string,
  conditionId: string,
  isFinalDelivery: boolean = false
): Promise<void> {
  try {
    await logDeliveryError({
      reminder_id: reminderId,
      message_id: messageId,
      condition_id: conditionId,
      recipient: isFinalDelivery ? "multiple-recipients" : "system",
      delivery_channel: "system",
      channel_order: 0,
      delivery_status: 'processing',
      error_message: null
    });
  } catch (logError) {
    console.warn("Error logging delivery attempt:", logError);
    // Continue despite logging error - non-fatal
  }
}

/**
 * Log the final delivery status in delivery log
 */
export async function logFinalDeliveryStatus(
  reminderId: string, 
  messageId: string, 
  conditionId: string, 
  anySuccess: boolean,
  allFailed: boolean,
  results: any[]
): Promise<void> {
  try {
    const supabase = supabaseClient();
    await supabase.from('reminder_delivery_log').insert({
      reminder_id: reminderId,
      message_id: messageId,
      condition_id: conditionId,
      recipient: "summary",
      delivery_channel: "summary",
      channel_order: 999,
      delivery_status: anySuccess ? 'delivered' : 'failed',
      error_message: allFailed ? "All reminder deliveries failed" : null,
      response_data: { results: results }
    });
  } catch (logError) {
    console.warn("Error logging final delivery status:", logError);
  }
}
