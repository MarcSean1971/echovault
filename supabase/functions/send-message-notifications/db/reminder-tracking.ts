
import { supabaseClient } from "../supabase-client.ts";

/**
 * Track message notification in the database
 */
export async function trackMessageNotification(messageId: string, conditionId: string) {
  try {
    const supabase = supabaseClient();
    
    // Enhanced tracking with better error handling and logging
    console.log(`[TRACKING] Tracking notification for message ${messageId}, condition ${conditionId}`);
    
    const { error } = await supabase
      .from("message_conditions")
      .update({
        last_checked: new Date().toISOString() // Update last_checked timestamp
      })
      .eq("id", conditionId);
    
    if (error) {
      console.error("[TRACKING] Error updating message condition:", error);
      throw error;
    }
    
    // Add additional tracking record to ensure we have visibility into the process
    try {
      await supabase.from('reminder_delivery_log').insert({
        reminder_id: `manual-track-${Date.now()}`,
        message_id: messageId,
        condition_id: conditionId,
        recipient: 'system',
        delivery_channel: 'tracking',
        channel_order: 0,
        delivery_status: 'processing',
        response_data: { tracked_at: new Date().toISOString() }
      });
    } catch (logError) {
      console.error("[TRACKING] Error creating tracking log:", logError);
      // Non-fatal error, continue execution
    }
    
    // CRITICAL: Directly trigger the email sending function
    try {
      console.log("[TRACKING] Directly triggering reminder email function");
      const { data, error: triggerError } = await supabase.functions.invoke("send-reminder-emails", {
        body: {
          messageId: messageId,
          debug: true,
          forceSend: true,
          source: "direct-manual-trigger"
        }
      });
      
      console.log("[TRACKING] Trigger response:", data);
      
      if (triggerError) {
        console.error("[TRACKING] Error triggering email function:", triggerError);
        throw triggerError;
      }
    } catch (triggerError) {
      console.error("[TRACKING] Exception triggering email function:", triggerError);
      // Log this error but don't throw, as we want to return success for the original tracking
    }
    
    return true;
  } catch (error) {
    console.error("[TRACKING] Error in trackMessageNotification:", error);
    throw error;
  }
}

/**
 * Update reminder times for condition - ensures we don't miss any reminders
 */
export async function markRemindersObsolete(
  conditionId: string,
  messageId: string
): Promise<boolean> {
  try {
    const supabase = supabaseClient();
    
    // Enhanced logging to track usage
    console.log(`[REMINDER-TRACKING] Marking reminders as obsolete for condition ${conditionId}, message ${messageId}`);
    
    // IMPORTANT FIX: Always use message_id in the query (this was the root cause)
    const { error, count } = await supabase
      .from('reminder_schedule')
      .update({ status: 'obsolete' })
      .eq('status', 'pending')
      .eq('message_id', messageId);
    
    if (error) {
      console.error("[REMINDER-TRACKING] Error marking reminders as obsolete:", error);
      return false;
    }
    
    console.log(`[REMINDER-TRACKING] Successfully marked ${count || 'unknown number of'} reminders as obsolete for message ${messageId}`);
    
    // IMMEDIATELY check for any reminders that should be processed now
    try {
      console.log("[REMINDER-TRACKING] Running immediate reminder check for message:", messageId);
      await supabase.functions.invoke("send-reminder-emails", {
        body: {
          messageId: messageId,
          debug: true,
          forceSend: true,
          source: "obsolete-immediate-check"
        }
      });
    } catch (checkError) {
      console.error("[REMINDER-TRACKING] Error running immediate reminder check:", checkError);
      // Non-fatal error, continue execution
    }
    
    return true;
  } catch (error) {
    console.error("[REMINDER-TRACKING] Error in markRemindersObsolete:", error);
    return false;
  }
}
