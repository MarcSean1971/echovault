/**
 * Utility functions for the reminder service
 */
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Mark reminders for a message as obsolete to prevent duplicates
 */
export async function markRemindersAsObsolete(
  messageId: string, 
  conditionId: string, 
  isEditOperation: boolean = false
): Promise<boolean> {
  try {
    console.log(`[REMINDER-UTILS] Marking reminders obsolete for message ${messageId}, isEdit: ${isEditOperation}`);
    
    // Mark existing reminders for this message as obsolete
    const { error } = await supabase
      .from('reminder_schedule')
      .update({ status: 'obsolete' })
      .eq('status', 'pending')
      .eq('message_id', messageId);
    
    if (error) {
      console.error("[REMINDER-UTILS] Error marking reminders as obsolete:", error);
      return false;
    }
    
    // Track this operation to avoid duplicate triggers
    try {
      // Check if a similar operation was done recently (within 5 minutes)
      const recentCheck = new Date();
      recentCheck.setMinutes(recentCheck.getMinutes() - 5);
      
      const { data: recentNotifications } = await supabase
        .from('reminder_delivery_log')
        .select('id')
        .eq('message_id', messageId)
        .eq('delivery_channel', 'obsolete-operation')
        .gt('created_at', recentCheck.toISOString())
        .limit(1);
      
      if (recentNotifications && recentNotifications.length > 0) {
        console.log("[REMINDER-UTILS] Skipping duplicate operation - already done recently");
        return true; // Skip duplicate processing
      }
      
      // Log the operation for deduplication
      await supabase.from('reminder_delivery_log').insert({
        reminder_id: `obsolete-op-${Date.now()}`,
        message_id: messageId,
        condition_id: conditionId,
        recipient: 'system',
        delivery_channel: 'obsolete-operation', 
        delivery_status: 'processing',
        response_data: { 
          timestamp: new Date().toISOString(),
          operation: 'mark-obsolete',
          isEdit: isEditOperation
        }
      });
      
      console.log("[REMINDER-UTILS] Successfully logged obsolete operation");
    } catch (logError) {
      console.warn("[REMINDER-UTILS] Error logging obsolete operation:", logError);
      // Non-fatal, continue
    }
    
    // Critical: Skip any immediate notification checks if this is an edit operation
    if (!isEditOperation) {
      console.log("[REMINDER-UTILS] Not an edit operation, checking if immediate notification needed");
      // This would be where additional processing occurs, but we'll keep it minimal
    }
    
    return true;
  } catch (error) {
    console.error("[REMINDER-UTILS] Error in markRemindersAsObsolete:", error);
    toast({
      title: "Error",
      description: "Failed to update reminder status",
      variant: "destructive"
    });
    return false;
  }
}

/**
 * Mark existing reminders as obsolete
 * Updated to handle RLS permissions
 */
export async function markExistingRemindersObsolete(messageId: string, conditionId: string): Promise<boolean> {
  try {
    console.log(`[REMINDER-SERVICE] Marking existing reminders as obsolete for message ${messageId}, condition ${conditionId}`);
    
    const { error } = await supabase
      .from('reminder_schedule')
      .update({ status: 'obsolete' })
      .eq('status', 'pending')
      .eq('message_id', messageId)
      .eq('condition_id', conditionId);
      
    if (error) {
      // Check if this is a permissions error from RLS
      if (error.code === "42501" || error.message?.includes("permission denied")) {
        console.warn("[REMINDER-SERVICE] Permission denied marking reminders as obsolete - user likely doesn't own this message");
      } else {
        console.error("[REMINDER-SERVICE] Error marking reminders as obsolete:", error);
      }
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("[REMINDER-SERVICE] Error in markExistingRemindersObsolete:", error);
    return false;
  }
}
