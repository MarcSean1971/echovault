
import { useState, useEffect } from "react";
import { isAfter, addHours, differenceInHours, format } from "date-fns";
import { calculateUpcomingReminders, formatReminderDate, formatReminderShortDate } from "@/utils/reminderUtils";

interface ReminderInfo {
  date: Date;
  formattedText: string;
  formattedShortDate: string;
  isImportant: boolean;
}

export function useNextReminders(deadline: Date | null, reminderMinutes: number[] = [], refreshTrigger?: number) {
  const [upcomingReminders, setUpcomingReminders] = useState<ReminderInfo[]>([]);
  const [hasReminders, setHasReminders] = useState<boolean>(false);
  
  useEffect(() => {
    if (!deadline || !reminderMinutes || reminderMinutes.length === 0) {
      setUpcomingReminders([]);
      setHasReminders(false);
      return;
    }
    
    // Calculate reminder dates
    const now = new Date();
    const reminderDates = calculateUpcomingReminders(deadline, reminderMinutes);
    
    // Format as reminder info objects
    const reminderInfos: ReminderInfo[] = reminderDates.map(date => {
      // Calculate if this reminder is important (within 24 hours)
      const hoursUntil = differenceInHours(date, now);
      const isImportant = hoursUntil <= 24;
      
      return {
        date,
        formattedText: formatReminderDate(date),
        formattedShortDate: formatReminderShortDate(date),
        isImportant
      };
    });
    
    setUpcomingReminders(reminderInfos);
    setHasReminders(reminderInfos.length > 0 || reminderMinutes.length > 0);
    
    // Set up a timer to refresh the formatted times
    const timer = setInterval(() => {
      setUpcomingReminders(reminders => 
        reminders.map(reminder => ({
          ...reminder,
          formattedText: formatReminderDate(reminder.date),
          formattedShortDate: formatReminderShortDate(reminder.date)
        }))
      );
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, [deadline, reminderMinutes, refreshTrigger]);
  
  return { upcomingReminders, hasReminders };
}
