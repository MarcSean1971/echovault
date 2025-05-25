
/**
 * SIMPLIFIED: Service functions for creating and managing reminder schedules
 * This now delegates to the simple reminder service
 */

import { createReminderSchedule, markRemindersObsolete } from "@/services/reminders/simpleReminderService";
import { ReminderScheduleParams, ReminderResult } from "./types";

/**
 * SIMPLIFIED: Create or update reminder schedule - delegates to simple service
 */
export async function createOrUpdateReminderSchedule(params: ReminderScheduleParams, isEdit: boolean = false): Promise<boolean> {
  try {
    console.log("[SCHEDULE-SERVICE] SIMPLIFIED - Creating reminder schedule for:", params);
    
    // Mark existing reminders as obsolete first
    await markRemindersObsolete(params.messageId);
    
    // Create new reminder schedule using simplified logic
    const success = await createReminderSchedule({
      messageId: params.messageId,
      conditionId: params.conditionId,
      conditionType: params.conditionType,
      triggerDate: params.triggerDate,
      lastChecked: params.lastChecked,
      hoursThreshold: params.hoursThreshold,
      minutesThreshold: params.minutesThreshold,
      reminderHours: params.reminderMinutes ? params.reminderMinutes.map(m => m / 60) : undefined
    });
    
    if (success) {
      // Broadcast an update event
      window.dispatchEvent(new CustomEvent('conditions-updated', { 
        detail: { 
          messageId: params.messageId,
          conditionId: params.conditionId,
          updatedAt: new Date().toISOString(),
          action: 'reminder-schedule-created-simplified'
        }
      }));
    }
    
    return success;
    
  } catch (error) {
    console.error("[SCHEDULE-SERVICE] SIMPLIFIED - Error:", error);
    return false;
  }
}
