
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { getUpcomingReminders, formatReminderSchedule } from '@/utils/reminderScheduler';

export interface NextRemindersInfo {
  loading: boolean;
  nextReminder: Date | null;
  formattedNextReminder: string | null;
  allReminders: Date[];
  formattedAllReminders: string[];
}

/**
 * Hook to get information about upcoming reminders for a message
 */
export function useNextReminders(messageId: string | undefined, refreshTrigger: number = 0): NextRemindersInfo {
  const [info, setInfo] = useState<NextRemindersInfo>({
    loading: true,
    nextReminder: null,
    formattedNextReminder: null,
    allReminders: [],
    formattedAllReminders: []
  });

  useEffect(() => {
    if (!messageId) {
      setInfo(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchReminderData = async () => {
      try {
        // Get all upcoming reminders for this message
        const upcomingReminders = await getUpcomingReminders(messageId);
        
        // Sort by closest first (should already be sorted but just to be safe)
        const sortedReminders = upcomingReminders.sort((a, b) => 
          a.scheduledAt.getTime() - b.scheduledAt.getTime()
        );
        
        // Extract just the dates for simple access
        const reminderDates = sortedReminders.map(r => r.scheduledAt);
        
        // Format for display
        const formattedReminders = formatReminderSchedule(sortedReminders);
        
        // Get the next reminder (first in the sorted list)
        const nextReminder = reminderDates.length > 0 ? reminderDates[0] : null;
        
        // Format the next reminder with relative time
        const formattedNextReminder = nextReminder 
          ? formatDistanceToNow(nextReminder, { addSuffix: true })
          : null;
        
        setInfo({
          loading: false,
          nextReminder,
          formattedNextReminder,
          allReminders: reminderDates,
          formattedAllReminders: formattedReminders
        });
      } catch (error) {
        console.error("Error in useNextReminders:", error);
        setInfo(prev => ({ ...prev, loading: false }));
      }
    };
    
    fetchReminderData();
    
    // Set up a timer to refresh the formatted times
    const timer = setInterval(() => {
      setInfo(prev => {
        if (!prev.nextReminder) {
          return prev; // No dates to update
        }
        
        // Update the formatted string for display
        return {
          ...prev,
          formattedNextReminder: formatDistanceToNow(prev.nextReminder, { addSuffix: true })
        };
      });
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, [messageId, refreshTrigger]);

  return info;
}
