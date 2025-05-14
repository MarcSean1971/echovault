
import { useState, useEffect } from "react";
import { calculateUpcomingReminders, formatReminderDate, formatReminderShortDate } from "@/utils/reminderUtils";

export interface ReminderInfo {
  date: Date;
  formattedText: string;
  formattedShortDate: string; // Added short date format
}

/**
 * Hook to get upcoming reminders for a message
 * @param deadline The message deadline
 * @param reminderMinutes Array of reminder times in minutes before deadline
 * @param refreshTrigger A value that when changed will cause reminders to recalculate
 * @returns Information about upcoming reminders
 */
export function useNextReminders(
  deadline: Date | null, 
  reminderMinutes: number[] = [],
  refreshTrigger: number = 0
) {
  const [upcomingReminders, setUpcomingReminders] = useState<ReminderInfo[]>([]);
  const [nextReminder, setNextReminder] = useState<ReminderInfo | null>(null);
  const [hasReminders, setHasReminders] = useState(false);

  useEffect(() => {
    // Calculate all upcoming reminders
    const reminderDates = calculateUpcomingReminders(deadline, reminderMinutes);
    
    // Create formatted reminder info objects
    const reminderInfos = reminderDates.map(date => ({
      date,
      formattedText: formatReminderDate(date),
      formattedShortDate: formatReminderShortDate(date), // Add short date format
    }));
    
    setUpcomingReminders(reminderInfos);
    setNextReminder(reminderInfos.length > 0 ? reminderInfos[0] : null);
    setHasReminders(reminderMinutes.length > 0);
    
    // Set up a timer to refresh the formatted times
    const timer = setInterval(() => {
      setUpcomingReminders(prev => prev.map(reminder => ({
        ...reminder,
        formattedText: formatReminderDate(reminder.date),
        // No need to update short date as it doesn't change with time passing
      })));
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, [deadline, reminderMinutes, refreshTrigger]);

  return {
    upcomingReminders,
    nextReminder,
    hasReminders
  };
}
