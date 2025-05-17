
import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { getUpcomingReminders, formatReminderSchedule } from "@/utils/reminderScheduler";

interface ReminderInfo {
  formattedShortDate: string;
  formattedText: string;
  isImportant: boolean;
}

export function useNextReminders(
  messageId: string | undefined, 
  refreshTrigger: number = 0
) {
  const [upcomingReminders, setUpcomingReminders] = useState<ReminderInfo[]>([]);
  const [hasReminders, setHasReminders] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<number>(Date.now());
  
  // Function to force refresh data
  const forceRefresh = useCallback(() => {
    console.log(`[useNextReminders] Force refreshing data for message ${messageId}`);
    setLastRefreshed(Date.now());
  }, [messageId]);
  
  // Fetch reminders when messageId, refreshTrigger, or lastRefreshed changes
  useEffect(() => {
    if (!messageId) {
      setUpcomingReminders([]);
      setHasReminders(false);
      setIsLoading(false);
      return;
    }
    
    const fetchReminders = async () => {
      console.log(`[useNextReminders] Fetching reminders for message ${messageId} (trigger: ${refreshTrigger}, lastRefreshed: ${lastRefreshed})`);
      setIsLoading(true);
      
      try {
        // Get upcoming reminders from the database
        const reminders = await getUpcomingReminders(messageId);
        console.log(`[useNextReminders] Found ${reminders.length} upcoming reminders for message ${messageId}`, reminders);
        
        // Check if there are any reminders
        setHasReminders(reminders.length > 0);
        
        if (reminders.length > 0) {
          // Process reminders for display
          const processed: ReminderInfo[] = reminders.map(reminder => {
            const timeUntil = formatDistanceToNow(reminder.scheduledAt, { addSuffix: true });
            const shortDate = new Intl.DateTimeFormat('en-US', { 
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            }).format(reminder.scheduledAt);
            
            return {
              formattedShortDate: shortDate,
              formattedText: `${reminder.reminderType === 'final_delivery' ? 'Final delivery' : 'Reminder'} ${timeUntil}`,
              isImportant: reminder.reminderType === 'final_delivery' || reminder.priority === 'critical'
            };
          });
          
          setUpcomingReminders(processed);
        } else {
          setUpcomingReminders([]);
        }
      } catch (error) {
        console.error(`[useNextReminders] Error fetching reminders for message ${messageId}:`, error);
        setUpcomingReminders([]);
        setHasReminders(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReminders();
  }, [messageId, refreshTrigger, lastRefreshed]);
  
  return {
    upcomingReminders,
    hasReminders,
    isLoading,
    forceRefresh,
    lastRefreshed
  };
}
