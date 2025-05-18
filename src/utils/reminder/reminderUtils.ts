import { supabase } from "@/integrations/supabase/client";
import { markRemindersAsObsolete as markRemindersObsolete } from "@/services/messages/reminder";

/**
 * Mark existing reminders as obsolete
 * This is a wrapper around the service function to maintain API compatibility
 */
export async function markExistingRemindersObsolete(messageId: string, conditionId: string): Promise<boolean> {
  return markRemindersObsolete(messageId, conditionId);
}

/**
 * Parse reminder hours string into an array of minutes
 * e.g. "0.5h,1h,2h" => [30, 60, 120]
 */
export function parseReminderMinutes(reminderHours: string | null | undefined): number[] | null {
  if (!reminderHours) {
    return null;
  }

  try {
    const hoursArray = reminderHours.split(",");
    const minutesArray = hoursArray.map(hourString => {
      const trimmedHourString = hourString.trim().toLowerCase();
      
      if (trimmedHourString.endsWith("h")) {
        const hours = parseFloat(trimmedHourString.slice(0, -1));
        return Math.round(hours * 60);
      } else if (trimmedHourString.endsWith("m")) {
        return parseInt(trimmedHourString.slice(0, -1), 10);
      } else {
        // If no unit is provided, assume it's in minutes
        return parseInt(trimmedHourString, 10);
      }
    });

    return minutesArray;
  } catch (error) {
    console.error("Error parsing reminder hours:", error);
    return null;
  }
}

/**
 * Format reminder time in hours and minutes
 * e.g. 60 => "1h", 30 => "30m"
 */
export function formatReminderTime(minutes: number): string {
  if (minutes >= 60) {
    return `${(minutes / 60).toFixed(1)}h`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Get effective deadline based on condition type
 */
export function getEffectiveDeadline(condition: any): Date | null {
  if (!condition) {
    return null;
  }
  
  // Handle different condition types
  if (condition.condition_type === 'no_check_in' || condition.condition_type === 'regular_check_in' || condition.condition_type === 'inactivity_to_date') {
    if (!condition.last_checked || !condition.hours_threshold) {
      console.warn(`[REMINDER-UTILS] Cannot determine deadline for ${condition.condition_type} without last_checked and hours_threshold`);
      return null;
    }
    
    const lastCheckedDate = new Date(condition.last_checked);
    const deadline = new Date(lastCheckedDate);
    deadline.setHours(deadline.getHours() + condition.hours_threshold);
    
    if (condition.minutes_threshold) {
      deadline.setMinutes(deadline.getMinutes() + condition.minutes_threshold);
    }
    
    return deadline;
  } else if (condition.trigger_date) {
    return new Date(condition.trigger_date);
  } else {
    console.warn("[REMINDER-UTILS] Could not determine deadline for condition");
    return null;
  }
}
