
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
 * CRITICAL FIX: Removed the isEdit parameter restriction for immediate checks
 */
export async function markRemindersObsolete(
  conditionId: string,
  messageId: string,
  isEditOperation: boolean = false
): Promise<boolean> {
  try {
    const supabase = supabaseClient();
    
    // Enhanced logging to track usage
    console.log(`[REMINDER-TRACKING] Marking reminders as obsolete for condition ${conditionId}, message ${messageId}, isEdit: ${isEditOperation}`);
    
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
    
    // CRITICAL FIX: Make deduplication less restrictive (only 1 minute instead of 5)
    try {
      // Check if a notification was sent in the last 1 minute to avoid duplicates
      const recentCheck = new Date();
      recentCheck.setMinutes(recentCheck.getMinutes() - 1);
      
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
        response_data: { source: "markRemindersObsolete", time: new Date().toISOString(), isEdit: isEditOperation }
      });
      
      // CRITICAL FIX: Allow immediate checks even for edit operations with a flag
      // This ensures that reminders are still processed after edits
      const forceSend = !isEditOperation; // Only force send for non-edit operations
      
      // IMMEDIATE CHECK: Always run the immediate check, but only force for non-edits
      console.log(`[REMINDER-TRACKING] Running immediate reminder check for message: ${messageId}, forceSend: ${forceSend}`);
      await supabase.functions.invoke("send-reminder-emails", {
        body: {
          messageId: messageId,
          debug: true,
          forceSend: forceSend,
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
