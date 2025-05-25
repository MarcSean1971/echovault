
import { useState, useEffect } from 'react';
import { useReminderDataFetcher } from './reminder/useReminderDataFetcher';
import { formatReminderSchedule } from '@/utils/reminder/reminderFormatter';

/**
 * Hook to get upcoming reminders for a specific message
 * It returns string representations of the reminders for display
 * And supports force refreshing via a refreshTrigger parameter
 */
export function useNextReminders(messageId: string | undefined, refreshTrigger: number = 0) {
  const [lastRefreshed, setLastRefreshed] = useState<number>(0);
  const [upcomingReminders, setUpcomingReminders] = useState<string[]>([]);
  const [hasReminders, setHasReminders] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { fetchReminderData, isLoading, permissionError } = useReminderDataFetcher(messageId);
  
  // Refresh function that can be called externally
  const forceRefresh = async () => {
    if (!messageId) return;
    
    try {
      console.log(`[useNextReminders] Force refreshing reminders for message ${messageId}`);
      const result = await fetchReminderData();
      
      if (result) {
        const formattedReminders = formatReminderSchedule(result.upcomingReminders);
        console.log(`[useNextReminders] Fetched ${formattedReminders.length} formatted reminders`);
        
        setUpcomingReminders(formattedReminders);
        setHasReminders(result.upcomingReminders.length > 0 || result.reminderHistory.length > 0);
        setLastRefreshed(Date.now());
        setError(null);
      } else {
        console.log(`[useNextReminders] No reminder data returned for message ${messageId}`);
        setUpcomingReminders([]);
        setHasReminders(false);
        if (permissionError) {
          setError("Permission error: You don't have access to this message's reminders");
        }
      }
    } catch (err: any) {
      console.error(`[useNextReminders] Error refreshing reminders:`, err);
      setError(err.message || 'Failed to fetch reminders');
    }
  };
  
  // Effect to load data when messageId or refreshTrigger changes
  useEffect(() => {
    if (messageId) {
      forceRefresh();
    }
  }, [messageId, refreshTrigger]);
  
  return {
    upcomingReminders,
    hasReminders,
    isLoading,
    forceRefresh,
    error,
    lastRefreshed,
    permissionError
  };
}
