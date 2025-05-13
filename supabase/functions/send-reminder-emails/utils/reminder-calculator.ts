
/**
 * Calculate the next reminder time based on a deadline and reminder minutes
 * @param deadline The deadline date
 * @param reminderMinutes Array of reminder times in minutes before deadline
 * @param justSentReminderMinute The reminder minute that was just sent (to exclude)
 * @returns The next reminder time or null if no more reminders
 */
export function calculateNextReminderTime(
  deadline: Date,
  reminderMinutes: number[],
  justSentReminderMinute: number | null
): Date | null {
  const now = new Date();
  const sortedMinutes = [...reminderMinutes].sort((a, b) => b - a); // Sort desc (largest/earliest first)
  
  // If we just sent a reminder, find the next one that's smaller (closer to deadline)
  if (justSentReminderMinute !== null) {
    const nextReminderMinutes = sortedMinutes.filter(min => min < justSentReminderMinute);
    
    if (nextReminderMinutes.length === 0) {
      console.log("No more reminders scheduled");
      return null;
    }
    
    const nextReminderMinute = nextReminderMinutes[0];
    const nextReminderTime = new Date(deadline.getTime() - (nextReminderMinute * 60 * 1000));
    
    // If the next reminder is in the past, there's no valid next reminder
    if (nextReminderTime <= now) {
      console.log(`Next reminder time (${nextReminderTime.toISOString()}) is in the past, no more reminders`);
      return null;
    }
    
    return nextReminderTime;
  }
  
  // If we didn't just send a reminder, find the next reminder from now
  for (const minutes of sortedMinutes) {
    const reminderTime = new Date(deadline.getTime() - (minutes * 60 * 1000));
    
    // If this reminder is in the future, it's our next reminder
    if (reminderTime > now) {
      return reminderTime;
    }
  }
  
  // If we get here, there are no more future reminders
  return null;
}
