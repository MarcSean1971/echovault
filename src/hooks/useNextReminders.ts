
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { getUpcomingReminders, formatReminderSchedule } from '@/utils/reminderScheduler';

export interface NextRemindersInfo {
  loading: boolean;
  nextReminder: Date | null;
  formattedNextReminder: string | null;
  allReminders: Date[];
  formattedAllReminders: string[];
  // Add the missing properties that the ReminderSection component is using
  upcomingReminders: { 
    scheduledAt: Date;
    formattedText: string;
    formattedShortDate: string;
    reminderType: string;
  }[];
  hasReminders: boolean;
}

/**
 * Hook to get information about upcoming reminders for a message
 */
export function useNextReminders(deadline: Date | null, reminderMinutes: number[] = [], refreshTrigger: number = 0): NextRemindersInfo {
  const [info, setInfo] = useState<NextRemindersInfo>({
    loading: true,
    nextReminder: null,
    formattedNextReminder: null,
    allReminders: [],
    formattedAllReminders: [],
    upcomingReminders: [],
    hasReminders: false
  });

  useEffect(() => {
    if (!deadline) {
      setInfo(prev => ({ ...prev, loading: false, hasReminders: false }));
      return;
    }

    const calculateUpcomingReminders = () => {
      try {
        // Calculate timestamps for reminders based on the deadline and reminder minutes
        const now = new Date();
        const upcomingReminders = reminderMinutes.map(minutes => {
          const reminderDate = new Date(deadline.getTime() - (minutes * 60 * 1000));
          
          return {
            scheduledAt: reminderDate,
            reminderType: 'reminder',
            formattedText: formatDistanceToNow(reminderDate, { addSuffix: true }),
            formattedShortDate: new Intl.DateTimeFormat('en-US', { 
              month: 'short', 
              day: 'numeric', 
              hour: 'numeric', 
              minute: '2-digit' 
            }).format(reminderDate)
          };
        }).filter(reminder => reminder.scheduledAt > now)
        .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

        // Add the final delivery as the last reminder
        if (deadline > now) {
          upcomingReminders.push({
            scheduledAt: deadline,
            reminderType: 'final_delivery',
            formattedText: formatDistanceToNow(deadline, { addSuffix: true }),
            formattedShortDate: new Intl.DateTimeFormat('en-US', { 
              month: 'short', 
              day: 'numeric', 
              hour: 'numeric', 
              minute: '2-digit' 
            }).format(deadline)
          });
        }

        // Extract just the dates for simple access
        const reminderDates = upcomingReminders.map(r => r.scheduledAt);
        
        // Get the next reminder (first in the sorted list)
        const nextReminder = reminderDates.length > 0 ? reminderDates[0] : null;
        
        // Format the next reminder with relative time
        const formattedNextReminder = nextReminder 
          ? formatDistanceToNow(nextReminder, { addSuffix: true })
          : null;

        // Format all reminders for display
        const formattedReminders = upcomingReminders.map(r => 
          `${r.formattedShortDate} (${r.reminderType === 'reminder' ? 'Reminder' : 'Final Delivery'})`
        );
        
        setInfo({
          loading: false,
          nextReminder,
          formattedNextReminder,
          allReminders: reminderDates,
          formattedAllReminders: formattedReminders,
          upcomingReminders: upcomingReminders,
          hasReminders: reminderDates.length > 0
        });
      } catch (error) {
        console.error("Error in useNextReminders:", error);
        setInfo(prev => ({ ...prev, loading: false, hasReminders: false }));
      }
    };
    
    calculateUpcomingReminders();
    
    // Set up a timer to refresh the formatted times
    const timer = setInterval(() => {
      calculateUpcomingReminders();
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, [deadline, reminderMinutes, refreshTrigger]);

  return info;
}
