
/**
 * Check-in specific reminder generation functions
 */
import { generateReminderSchedule } from './coreGenerator';

/**
 * Generate schedule for check-in type conditions
 * @param reminderMinutes Array of minutes before deadline when reminders should be sent
 */
export async function generateCheckInReminderSchedule(
  messageId: string,
  conditionId: string,
  lastCheckedDate: Date | null,
  hoursThreshold: number,
  minutesThreshold: number = 0,
  reminderMinutes: number[]
): Promise<boolean> {
  try {
    if (!lastCheckedDate) {
      console.error(`[REMINDER-GENERATOR] Cannot generate check-in reminder schedule for message ${messageId} - no last checked date`);
      return false;
    }
    
    // Make sure we have at least one reminder
    if (reminderMinutes.length === 0) {
      console.warn(`[REMINDER-GENERATOR] No reminder minutes provided for message ${messageId}, using default`);
      reminderMinutes = [24 * 60]; // Default to 24 hours (1440 minutes) before deadline if none specified
    }
    
    // Calculate virtual deadline based on last check-in + threshold
    const virtualDeadline = new Date(lastCheckedDate);
    virtualDeadline.setHours(virtualDeadline.getHours() + hoursThreshold);
    virtualDeadline.setMinutes(virtualDeadline.getMinutes() + minutesThreshold);
    
    // Add debug log to check the reminder minutes array
    console.log(`[REMINDER-GENERATOR] Generating check-in reminder schedule for message ${messageId}`);
    console.log(`[REMINDER-GENERATOR] Last checked: ${lastCheckedDate.toISOString()}`);
    console.log(`[REMINDER-GENERATOR] Hours threshold: ${hoursThreshold}, Minutes threshold: ${minutesThreshold}`);
    console.log(`[REMINDER-GENERATOR] Virtual deadline: ${virtualDeadline.toISOString()}`);
    console.log(`[REMINDER-GENERATOR] Reminder minutes (count: ${reminderMinutes.length}): ${JSON.stringify(reminderMinutes)}`);
    
    // Ensure reminder minutes are unique
    const uniqueReminderMinutes = Array.from(new Set(reminderMinutes)).sort((a, b) => a - b);
    if (uniqueReminderMinutes.length !== reminderMinutes.length) {
      console.warn(`[REMINDER-GENERATOR] Removed duplicate reminder minutes: ${reminderMinutes.length} -> ${uniqueReminderMinutes.length}`);
      reminderMinutes = uniqueReminderMinutes;
    }
    
    return generateReminderSchedule(messageId, conditionId, virtualDeadline, reminderMinutes);
  } catch (error) {
    console.error("[REMINDER-GENERATOR] Error in generateCheckInReminderSchedule:", error);
    return false;
  }
}
