
import { supabaseClient } from "../supabase-client.ts";

/**
 * Track message notification in the database
 * FIXED: Removed direct email function call that was causing infinite loop
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
    
    // CRITICAL FIX: Removed the direct call to the email sending function
    // that was causing the infinite loop
    
    return true;
  } catch (error) {
    console.error("[TRACKING] Error in trackMessageNotification:", error);
    throw error;
  }
}

/**
 * Update reminder times for condition - ensures we don't miss any reminders
 * FIXED: Added deduplication to prevent multiple emails
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
    
    // CRITICAL FIX: Add deduplication by checking if notification was already sent recently
    try {
      // Check if a notification was sent in the last 5 minutes to avoid duplicates
      const recentCheck = new Date();
      recentCheck.setMinutes(recentCheck.getMinutes() - 5);
      
      const { data: recentNotifications } = await supabase
        .from('reminder_delivery_log')
        .select('id')
        .eq('message_id', messageId)
        .eq('delivery_channel', 'immediate-check')
        .gt('created_at', recentCheck.toISOString())
        .limit(1);
      
      if (recentNotifications && recentNotifications.length > 0) {
        console.log("[REMINDER-TRACKING] Skipping immediate check as one was done recently");
        return true; // Skip sending another notification
      }
      
      // Create a tracking log for this check to prevent duplicates
      await supabase.from('reminder_delivery_log').insert({
        reminder_id: `obsolete-check-${Date.now()}`,
        message_id: messageId,
        condition_id: conditionId,
        recipient: 'system',
        delivery_channel: 'immediate-check',
        delivery_status: 'processing',
        response_data: { source: "markRemindersObsolete", time: new Date().toISOString() }
      });
      
      // CONTROLLED IMMEDIATE CHECK: Only proceed if no recent notification
      console.log("[REMINDER-TRACKING] Running immediate reminder check for message:", messageId);
      await supabase.functions.invoke("send-reminder-emails", {
        body: {
          messageId: messageId,
          debug: true,
          forceSend: false, // CRITICAL FIX: Changed to false to prevent forcing emails when not needed
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
