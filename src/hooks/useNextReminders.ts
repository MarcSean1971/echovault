
import { useState, useEffect } from "react";
import { format, formatDistanceToNow } from "date-fns";

interface NextReminderInfo {
  nextReminder: Date | null;
  formattedNextReminder: string | null;
  upcomingReminders: {
    formattedText: string;
    formattedShortDate: string;
    date: Date;
    isImportant: boolean;
  }[];
  hasReminders: boolean;
  loading: boolean;
}

/**
 * Hook to get information about scheduled reminders for a message
 */
export function useNextReminders(
  deadline: Date | null,
  reminderMinutes: number[] = [], 
  refreshTrigger: number = 0
): NextReminderInfo {
  const [loading, setLoading] = useState<boolean>(true);
  const [nextReminder, setNextReminder] = useState<Date | null>(null);
  const [formattedNextReminder, setFormattedNextReminder] = useState<string | null>(null);
  const [upcomingReminders, setUpcomingReminders] = useState<{
    formattedText: string;
    formattedShortDate: string;
    date: Date;
    isImportant: boolean;
  }[]>([]);
  const [hasReminders, setHasReminders] = useState<boolean>(false);

  // Calculate reminder dates when deadline or minutes array changes
  useEffect(() => {
    setLoading(true);

    if (!deadline || reminderMinutes.length === 0) {
      setLoading(false);
      setHasReminders(false);
      setUpcomingReminders([]);
      setNextReminder(null);
      setFormattedNextReminder(null);
      return;
    }

    try {
      // Calculate dates for each reminder
      const now = new Date();
      const reminderDates = reminderMinutes
        .map(minutes => {
          const reminderDate = new Date(deadline.getTime() - minutes * 60 * 1000);
          return {
            date: reminderDate,
            formattedText: format(reminderDate, "MMM d, yyyy h:mm a"),
            formattedShortDate: formatDistanceToNow(reminderDate, { addSuffix: true }),
            isPast: reminderDate < now,
            isImportant: false
          };
        })
        .filter(item => !item.isPast) // Filter out past reminders
        .sort((a, b) => a.date.getTime() - b.date.getTime()); // Sort by date ascending
      
      // Add the actual deadline
      reminderDates.push({
        date: deadline,
        formattedText: format(deadline, "MMM d, yyyy h:mm a") + " (Final Delivery)",
        formattedShortDate: formatDistanceToNow(deadline, { addSuffix: true }) + " (Final)",
        isPast: deadline < now,
        isImportant: true
      });
      
      // Filter out past reminders again and sort
      const futureReminders = reminderDates
        .filter(item => !item.isPast)
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      
      setUpcomingReminders(futureReminders);
      setHasReminders(reminderDates.length > 0);
      
      // Set the next reminder if there are any
      if (futureReminders.length > 0) {
        const next = futureReminders[0].date;
        setNextReminder(next);
        setFormattedNextReminder(formatDistanceToNow(next, { addSuffix: true }));
      } else {
        setNextReminder(null);
        setFormattedNextReminder(null);
      }
    } catch (err) {
      console.error("Error calculating reminder dates:", err);
    } finally {
      setLoading(false);
    }
  }, [deadline, reminderMinutes, refreshTrigger]);

  return {
    loading,
    nextReminder,
    formattedNextReminder,
    upcomingReminders,
    hasReminders
  };
}
