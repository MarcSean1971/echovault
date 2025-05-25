
import { useState, useEffect } from 'react';
import { useReminderDataFetcher } from './reminder/useReminderDataFetcher';

/**
 * Simplified batched reminders hook
 */
export function useBatchedReminders(messageIds: string[], refreshTrigger: number = 0) {
  const [reminders, setReminders] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const forceRefresh = async () => {
    if (!messageIds || messageIds.length === 0) return;
    
    setIsLoading(true);
    const reminderMap: Record<string, any> = {};
    
    // Fetch reminders for each message
    for (const messageId of messageIds) {
      try {
        const { fetchReminderData } = useReminderDataFetcher(messageId);
        const result = await fetchReminderData();
        
        if (result) {
          const now = new Date();
          const upcomingReminders = result.upcomingReminders
            .filter(r => r.scheduledAt > now)
            .map(r => {
              const timeUntil = r.scheduledAt.getTime() - now.getTime();
              const hoursUntil = Math.round(timeUntil / (1000 * 60 * 60));
              
              if (r.reminderType === 'final_delivery') {
                return `Final Delivery: ${r.scheduledAt.toLocaleString()}`;
              } else {
                return `Check-in Reminder: ${hoursUntil}h (${r.scheduledAt.toLocaleString()})`;
              }
            });
          
          reminderMap[messageId] = {
            messageId,
            nextReminder: result.upcomingReminders[0]?.scheduledAt || null,
            formattedNextReminder: result.upcomingReminders[0] 
              ? `${Math.round((result.upcomingReminders[0].scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60))}h`
              : null,
            hasSchedule: result.upcomingReminders.length > 0,
            upcomingReminders
          };
        }
      } catch (error) {
        console.error(`Error fetching reminders for message ${messageId}:`, error);
      }
    }
    
    setReminders(reminderMap);
    setIsLoading(false);
  };
  
  useEffect(() => {
    forceRefresh();
  }, [messageIds, refreshTrigger]);
  
  return {
    reminders,
    isLoading,
    forceRefresh
  };
}
