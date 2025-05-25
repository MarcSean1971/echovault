
import { supabase } from "@/integrations/supabase/client";
import { reminderMonitor } from "@/services/messages/monitoring/reminderMonitor";

// Start monitoring when the utility is loaded
reminderMonitor.start(); // Use start() instead of startMonitoring()

/**
 * Mark existing reminders obsolete - replaced by more specific function
 * FIXED: Improved error handling for permission issues
 * FIXED: Added isEdit parameter to control notification processing
 */
export async function markRemindersAsObsolete(
  messageId: string,
  conditionId?: string,
  isEdit: boolean = false
): Promise<boolean> {
  try {
    // Build query - target just the specific condition or all for this message
    let query = supabase
      .from('reminder_schedule')
      .update({ status: 'obsolete' })
      .eq('status', 'pending')
      .eq('message_id', messageId);
      
    // Add condition filter if specified
    if (conditionId) {
      query = query.eq('condition_id', conditionId);
    }
    
    // Execute the update
    const { data, error, count } = await query;
    
    if (error) {
      console.error(`[REMINDER-UTILS] Error marking reminders as obsolete for message ${messageId}:`, error);
      
      // Handle permission errors gracefully
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        console.log("[REMINDER-UTILS] Permission denied marking reminders obsolete. Attempting edge function fallback.");
        
        try {
          // Try using edge function as a fallback
          await supabase.functions.invoke("send-reminder-emails", {
            body: { 
              messageId, 
              conditionId: conditionId || null,
              debug: true,
              action: "mark-obsolete",
              isEdit: isEdit // Pass the isEdit flag to prevent triggering notifications
            }
          });
          console.log("[REMINDER-UTILS] Successfully triggered edge function to mark reminders obsolete");
          return true;
        } catch (edgeFunctionError) {
          console.error("[REMINDER-UTILS] Edge function fallback failed:", edgeFunctionError);
        }
      }
      
      return false;
    }
    
    console.log(`[REMINDER-UTILS] Successfully marked ${count || 'unknown'} reminders as obsolete`);
    return true;
  } catch (error) {
    console.error("[REMINDER-UTILS] Error in markRemindersAsObsolete:", error);
    return false;
  }
}

/**
 * Calculate the effective deadline for a condition based on its type
 */
export function getEffectiveDeadline(condition: any): Date | null {
  if (!condition) return null;

  // For scheduled conditions, use the trigger date
  if (condition.condition_type === "scheduled" && condition.trigger_date) {
    return new Date(condition.trigger_date);
  }
  
  // For check-in conditions (no_check_in, recurring_check_in, inactivity_to_date)
  // calculate deadline based on last check-in time plus threshold
  if (["no_check_in", "recurring_check_in", "inactivity_to_date"].includes(condition.condition_type) && 
      condition.last_checked) {
    
    // Parse last_checked to a Date object
    const lastChecked = new Date(condition.last_checked);
    
    // Create a new Date to represent the deadline
    const deadline = new Date(lastChecked);
    
    // Add hours threshold to the deadline
    if (condition.hours_threshold) {
      deadline.setHours(deadline.getHours() + condition.hours_threshold);
    }
    
    // Add minutes threshold to the deadline
    if (condition.minutes_threshold) {
      deadline.setMinutes(deadline.getMinutes() + condition.minutes_threshold);
    }
    
    return deadline;
  }
  
  // For types we don't understand, return null
  return null;
}

// Add an alias for backward compatibility
export const markExistingRemindersObsolete = markRemindersAsObsolete;

/**
 * Force check all reminders immediately (for debugging)
 */
export async function forceCheckAllReminders() {
  return reminderMonitor.forceProcessAllReminders();
}

/**
 * Get reminder system statistics
 */
export async function getReminderSystemStats() {
  return reminderMonitor.getSystemStats();
}
