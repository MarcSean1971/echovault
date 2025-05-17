
import { supabase } from "@/integrations/supabase/client";

/**
 * Convert reminder hours to minutes for storage consistency
 * This is important since our database stores reminder times in minutes
 * NOTE: This function name is misleading - the database column is called 'reminder_hours'
 * but actually stores values in minutes
 */
export function convertReminderHoursToMinutes(reminderHours: number[]): number[] {
  if (!reminderHours || reminderHours.length === 0) return [];
  
  return reminderHours.map(hours => hours * 60);
}

/**
 * Parse reminder values from condition to normalized minutes
 * IMPORTANT: The database column is called 'reminder_hours' but actually stores values in minutes
 * This function now correctly preserves the original values without any conversion
 */
export function parseReminderMinutes(reminderHours: any): number[] {
  if (!reminderHours || !Array.isArray(reminderHours) || reminderHours.length === 0) {
    return [];
  }
  
  // All values in the reminder_hours array are already in minutes
  // Return them directly without any conversion
  return reminderHours;
}

/**
 * Calculate the effective deadline based on condition type
 */
export function getEffectiveDeadline(condition: any): Date | null {
  if (!condition) return null;
  
  // For date-based conditions, use the trigger_date
  if (condition.trigger_date) {
    return new Date(condition.trigger_date);
  }
  
  // For check-in conditions, calculate based on last_checked + threshold
  if (['no_check_in', 'recurring_check_in', 'inactivity_to_date'].includes(condition.condition_type) 
      && condition.last_checked && (condition.hours_threshold || condition.minutes_threshold)) {
    const lastChecked = new Date(condition.last_checked);
    const hoursToAdd = condition.hours_threshold || 0;
    const minutesToAdd = condition.minutes_threshold || 0;
    
    const deadline = new Date(lastChecked);
    deadline.setHours(deadline.getHours() + hoursToAdd);
    deadline.setMinutes(deadline.getMinutes() + minutesToAdd);
    
    return deadline;
  }
  
  return null;
}

/**
 * Format reminder times into user-friendly text
 */
export function formatReminderTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} before`;
  } else {
    const hours = minutes / 60;
    if (hours % 1 === 0) {
      // Whole number of hours
      return `${hours} hour${hours !== 1 ? 's' : ''} before`;
    } else {
      // Hours and minutes
      const wholeHours = Math.floor(hours);
      const remainingMinutes = Math.round((hours - wholeHours) * 60);
      return `${wholeHours}h ${remainingMinutes}m before`;
    }
  }
}

/**
 * Clear existing reminders to prepare for new ones
 * This ensures we don't have duplicate or stale reminders
 */
export async function markExistingRemindersObsolete(messageId: string, conditionId?: string): Promise<boolean> {
  try {
    console.log(`[REMINDER-UTILS] Marking existing reminders as obsolete for message ${messageId}`);
    
    let query = supabase
      .from('reminder_schedule')
      .update({ status: 'obsolete' })
      .eq('status', 'pending')
      .eq('message_id', messageId);
    
    if (conditionId) {
      query = query.eq('condition_id', conditionId);
    }
    
    const { error } = await query;
      
    if (error) {
      console.error("[REMINDER-UTILS] Error marking reminders as obsolete:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("[REMINDER-UTILS] Error in markExistingRemindersObsolete:", error);
    return false;
  }
}

/**
 * Create a debug trigger for testing reminderss
 * This helps with manual testing of reminder functionality
 */
export async function debugTriggerReminder(messageId: string): Promise<any> {
  try {
    const { data, error } = await supabase.functions.invoke("send-reminder-emails", {
      body: {
        messageId: messageId,
        debug: true,
        forceSend: true
      }
    });
    
    if (error) {
      console.error("Error triggering reminder debug:", error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (err) {
    console.error("Error in debugTriggerReminder:", err);
    return { success: false, error: err };
  }
}
