
import { supabaseClient } from "../supabase-client.ts";

/**
 * Track message notification in the database
 * ENHANCED: Better tracking with delivery confirmation support
 */
export async function trackMessageNotification(messageId: string, conditionId: string, waitForCompletion: boolean = false) {
  try {
    const supabase = supabaseClient();
    
    // Enhanced tracking with better error handling and logging
    console.log(`[TRACKING] Tracking notification for message ${messageId}, condition ${conditionId}, waitForCompletion: ${waitForCompletion}`);
    
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
        response_data: { 
          tracked_at: new Date().toISOString(),
          wait_for_completion: waitForCompletion
        }
      });
    } catch (logError) {
      console.error("[TRACKING] Error creating tracking log:", logError);
      // Non-fatal error, continue execution
    }
    
    return true;
  } catch (error) {
    console.error("[TRACKING] Error in trackMessageNotification:", error);
    throw error;
  }
}

/**
 * Update reminder times for condition - ensures we don't miss any reminders
 * ENHANCED: Better handling for final delivery scenarios
 */
export async function markRemindersObsolete(
  conditionId: string,
  messageId: string,
  isEditOperation: boolean = false,
  isFinalDelivery: boolean = false
): Promise<boolean> {
  try {
    const supabase = supabaseClient();
    
    // Enhanced logging to track usage
    console.log(`[REMINDER-TRACKING] Marking reminders as obsolete for condition ${conditionId}, message ${messageId}, isEdit: ${isEditOperation}, isFinal: ${isFinalDelivery}`);
    
    // For final delivery, be more selective about which reminders to mark obsolete
    let query = supabase
      .from('reminder_schedule')
      .update({ status: 'obsolete' })
      .eq('status', 'pending')
      .eq('message_id', messageId);
    
    // If this is a final delivery, only mark non-final reminders as obsolete
    if (isFinalDelivery) {
      query = query.neq('reminder_type', 'final_delivery');
    }
    
    const { error, count } = await query;
    
    if (error) {
      console.error("[REMINDER-TRACKING] Error marking reminders as obsolete:", error);
      return false;
    }
    
    console.log(`[REMINDER-TRACKING] Successfully marked ${count || 'unknown number of'} reminders as obsolete for message ${messageId}`);
    
    // For final delivery, skip immediate checks to avoid race conditions
    if (isFinalDelivery) {
      console.log("[REMINDER-TRACKING] Skipping immediate check for final delivery to avoid race conditions");
      return true;
    }
    
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
