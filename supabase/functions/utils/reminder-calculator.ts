
/**
 * Calculate the next reminder time based on the deadline and available reminder times
 * 
 * @param deadline The deadline from which to calculate the reminder
 * @param reminderMinutes Array of minutes before deadline when reminders should be sent
 * @param currentReminderMinute Current reminder minute that was just triggered
 * @returns Date object with the next reminder time or null if no more reminders
 */
export function calculateNextReminderTime(
  deadline: Date,
  reminderMinutes: number[],
  currentReminderMinute: number | null
): Date | null {
  try {
    // Sort reminder minutes in descending order (furthest from deadline first)
    const sortedMinutes = [...reminderMinutes].sort((a, b) => b - a);
    
    // Find the index of the current reminder
    let currentIndex = -1;
    if (currentReminderMinute !== null) {
      currentIndex = sortedMinutes.indexOf(currentReminderMinute);
    }
    
    // Look for the next reminder after the current one
    const nextIndex = currentIndex + 1;
    
    // If there's no next reminder, return null
    if (nextIndex >= sortedMinutes.length) {
      return null;
    }
    
    // Calculate the next reminder time
    const nextReminderMinute = sortedMinutes[nextIndex];
    const nextReminderTime = new Date(deadline.getTime() - (nextReminderMinute * 60 * 1000));
    
    console.log(`Next reminder time calculated: ${nextReminderTime.toISOString()} (${nextReminderMinute} minutes before deadline)`);
    
    return nextReminderTime;
  } catch (error: any) {
    console.error("Error calculating next reminder time:", error);
    return null;
  }
}
