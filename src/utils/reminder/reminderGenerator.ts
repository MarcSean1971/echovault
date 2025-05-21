
/**
 * Main reminder generator module
 */
import { createOrUpdateReminderSchedule } from "@/services/messages/reminder/scheduleService";
import { ReminderScheduleParams } from "@/services/messages/reminder/types";

/**
 * Generate schedule for standard conditions
 * @param reminderMinutes Array of minutes before deadline when reminders should be sent
 * FIXED: Added isEdit parameter to control notification behavior
 */
export async function generateReminderSchedule(
  messageId: string,
  conditionId: string,
  deadlineDate: Date,
  reminderMinutes: number[],
  isEdit: boolean = false
): Promise<boolean> {
  console.log(`[REMINDER-GENERATOR] Generating reminder schedule for message ${messageId}`);
  console.log(`[REMINDER-GENERATOR] isEdit: ${isEdit}`);
  
  try {
    // MODIFIED: Allow empty reminder arrays - don't set defaults
    // Log the reminder minutes for debugging
    console.log(`[REMINDER-GENERATOR] Using ${reminderMinutes.length} reminder times:`, reminderMinutes);
    console.log(`[REMINDER-GENERATOR] Deadline: ${deadlineDate.toISOString()}`);
    
    // Ensure reminder minutes are unique and sorted if any exist
    const uniqueReminderMinutes = Array.from(new Set(reminderMinutes)).sort((a, b) => a - b);
    if (uniqueReminderMinutes.length !== reminderMinutes.length) {
      console.log(`[REMINDER-GENERATOR] Removed duplicate reminder minutes: ${reminderMinutes.length} -> ${uniqueReminderMinutes.length}`);
      reminderMinutes = uniqueReminderMinutes;
    }
    
    // Create parameters for the schedule service
    const params: ReminderScheduleParams = {
      messageId,
      conditionId,
      triggerDate: deadlineDate.toISOString(),
      reminderMinutes: reminderMinutes,
      conditionType: 'standard',
      lastChecked: null
    };
    
    // Create or update the reminder schedule
    return await createOrUpdateReminderSchedule(params, isEdit);
  } catch (error) {
    console.error("[REMINDER-GENERATOR] Error in generateReminderSchedule:", error);
    return false;
  }
}

/**
 * Generate schedule for check-in type conditions
 * FIXED: Added isEdit parameter to control notification behavior
 */
export async function generateCheckInReminderSchedule(
  messageId: string,
  conditionId: string,
  lastCheckedDate: Date | null,
  hoursThreshold: number,
  minutesThreshold: number = 0,
  reminderMinutes: number[],
  isEdit: boolean = false
): Promise<boolean> {
  try {
    if (!lastCheckedDate) {
      console.error(`[REMINDER-GENERATOR] Cannot generate check-in reminder schedule for message ${messageId} - no last checked date`);
      return false;
    }
    
    console.log(`[REMINDER-GENERATOR] Generating check-in reminder schedule for message ${messageId}`);
    console.log(`[REMINDER-GENERATOR] isEdit: ${isEdit}`);
    console.log(`[REMINDER-GENERATOR] Last checked: ${lastCheckedDate.toISOString()}`);
    
    // MODIFIED: Allow empty reminder arrays - don't set defaults
    
    // Calculate virtual deadline based on last check-in + threshold
    const virtualDeadline = new Date(lastCheckedDate);
    virtualDeadline.setHours(virtualDeadline.getHours() + hoursThreshold);
    virtualDeadline.setMinutes(virtualDeadline.getMinutes() + minutesThreshold);
    
    console.log(`[REMINDER-GENERATOR] Hours threshold: ${hoursThreshold}, Minutes threshold: ${minutesThreshold}`);
    console.log(`[REMINDER-GENERATOR] Virtual deadline: ${virtualDeadline.toISOString()}`);
    console.log(`[REMINDER-GENERATOR] Reminder minutes: ${JSON.stringify(reminderMinutes)}`);
    
    // Ensure reminder minutes are unique and sorted if any exist
    const uniqueReminderMinutes = Array.from(new Set(reminderMinutes)).sort((a, b) => a - b);
    if (uniqueReminderMinutes.length !== reminderMinutes.length) {
      console.log(`[REMINDER-GENERATOR] Removed duplicate reminder minutes: ${reminderMinutes.length} -> ${uniqueReminderMinutes.length}`);
      reminderMinutes = uniqueReminderMinutes;
    }
    
    // Create parameters for the schedule service
    const params: ReminderScheduleParams = {
      messageId,
      conditionId,
      conditionType: 'check_in',
      reminderMinutes: reminderMinutes,
      lastChecked: lastCheckedDate.toISOString(),
      hoursThreshold,
      minutesThreshold,
      triggerDate: virtualDeadline.toISOString()
    };
    
    // Create or update the reminder schedule
    return await createOrUpdateReminderSchedule(params, isEdit);
  } catch (error) {
    console.error("[REMINDER-GENERATOR] Error in generateCheckInReminderSchedule:", error);
    return false;
  }
}
