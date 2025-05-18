
/**
 * Calculate the next reminder time based on a deadline and reminder minutes
 * @param deadline The deadline date
 * @param reminderMinutes Array of reminder times in minutes before deadline
 * @param excludeReminderMinute Optional reminder minute to exclude
 * @returns The next reminder time or null if no more reminders
 */
export function calculateNextReminderTime(
  deadline: Date,
  reminderMinutes: number[],
  excludeReminderMinute?: number | null
): Date | null {
  const now = new Date();
  
  // Make sure we work with a fresh array and sort in descending order (furthest from deadline first)
  const sortedMinutes = [...reminderMinutes].sort((a, b) => b - a);
  
  console.log(`[REMINDER-CALCULATOR] Calculating next reminder time for deadline ${deadline.toISOString()}`);
  console.log(`[REMINDER-CALCULATOR] Using reminder minutes (sorted): ${JSON.stringify(sortedMinutes)}`);
  
  if (excludeReminderMinute !== undefined && excludeReminderMinute !== null) {
    console.log(`[REMINDER-CALCULATOR] Excluding reminder at ${excludeReminderMinute} minutes before deadline`);
  }
  
  // Find the next reminder time that's in the future
  for (const minutes of sortedMinutes) {
    // Skip the excluded reminder minute if specified
    if (excludeReminderMinute !== undefined && excludeReminderMinute !== null && minutes === excludeReminderMinute) {
      continue;
    }
    
    // Calculate when this reminder should happen
    const reminderTime = new Date(deadline.getTime() - (minutes * 60 * 1000));
    console.log(`[REMINDER-CALCULATOR] Reminder at ${minutes} minutes before deadline would be at ${reminderTime.toISOString()}`);
    
    // If this reminder is in the future, it's our next reminder
    if (reminderTime > now) {
      console.log(`[REMINDER-CALCULATOR] Found next reminder: ${minutes} minutes before deadline at ${reminderTime.toISOString()}`);
      return reminderTime;
    } else {
      console.log(`[REMINDER-CALCULATOR] Reminder at ${minutes} minutes before deadline is in the past, skipping`);
    }
  }
  
  console.log(`[REMINDER-CALCULATOR] No future reminders found for deadline ${deadline.toISOString()}`);
  return null;
}
