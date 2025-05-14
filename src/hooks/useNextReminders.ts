
import { useState, useEffect, useCallback } from "react";
import { 
  calculateUpcomingReminders, 
  formatReminderDate, 
  formatReminderShortDate,
  formatDateWithTimeZone
} from "@/utils/reminderUtils";

export interface ReminderItem {
  date: Date;
  formattedText: string;
  formattedShortDate: string;
}

interface NextRemindersResult {
  upcomingReminders: ReminderItem[];
  hasReminders: boolean;
  isLoading: boolean;
}

/**
 * Hook to get upcoming reminders for a message
 */
export function useNextReminders(
  deadline: Date | null,
  reminderMinutes: number[] = [],
  refreshTrigger: number = 0
): NextRemindersResult {
  const [state, setState] = useState<NextRemindersResult>({
    upcomingReminders: [],
    hasReminders: false,
    isLoading: true,
  });

  // Use useCallback to memoize the calculation function
  const calculateReminders = useCallback(() => {
    if (!deadline || reminderMinutes.length === 0) {
      setState({
        upcomingReminders: [],
        hasReminders: false,
        isLoading: false,
      });
      return;
    }

    const reminders = calculateUpcomingReminders(deadline, reminderMinutes);
    
    const formattedReminders = reminders.map(date => ({
      date,
      formattedText: formatReminderDate(date),
      formattedShortDate: formatReminderShortDate(date),
    }));

    setState({
      upcomingReminders: formattedReminders,
      hasReminders: reminderMinutes.length > 0,
      isLoading: false,
    });
  }, [deadline, reminderMinutes]);

  useEffect(() => {
    calculateReminders();
    
    // Set up a timer to refresh the formatted times periodically
    const timer = setInterval(() => {
      calculateReminders();
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, [calculateReminders, refreshTrigger]);

  return state;
}
