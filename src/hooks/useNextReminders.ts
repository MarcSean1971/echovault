
import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { getUpcomingReminders, formatReminderSchedule } from "@/utils/reminderScheduler";
import { toast } from "@/components/ui/use-toast";

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
  const [fetchAttempts, setFetchAttempts] = useState<number>(0);
  
  // Function to force refresh data with exponential backoff retry
  const forceRefresh = useCallback(() => {
    console.log(`[useNextReminders] Force refreshing data for message ${messageId}`);
    setLastRefreshed(Date.now());
    setFetchAttempts(0); // Reset attempt counter on manual refresh
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
      console.log(`[useNextReminders] Fetching reminders for message ${messageId} (trigger: ${refreshTrigger}, lastRefreshed: ${lastRefreshed}, attempt: ${fetchAttempts + 1})`);
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
          setFetchAttempts(0); // Reset attempt counter on success
        } else {
          setUpcomingReminders([]);
          
          // If this is a retry and we're still getting no results, implement exponential backoff
          if (fetchAttempts > 0 && fetchAttempts < 3) {
            console.log(`[useNextReminders] No reminders found on attempt ${fetchAttempts + 1}, scheduling retry`);
            const backoffDelay = Math.pow(2, fetchAttempts) * 1000; // Exponential backoff
            setTimeout(() => {
              setLastRefreshed(Date.now());
              setFetchAttempts(prev => prev + 1);
            }, backoffDelay);
          } else if (fetchAttempts >= 3) {
            console.warn(`[useNextReminders] Still no reminders after ${fetchAttempts + 1} attempts, giving up.`);
            setFetchAttempts(0); // Reset for future refreshes
          }
        }
      } catch (error) {
        console.error(`[useNextReminders] Error fetching reminders for message ${messageId}:`, error);
        setUpcomingReminders([]);
        setHasReminders(false);
        
        if (fetchAttempts < 3) {
          // Retry with exponential backoff
          const backoffDelay = Math.pow(2, fetchAttempts) * 1000;
          console.log(`[useNextReminders] Will retry in ${backoffDelay}ms`);
          setTimeout(() => {
            setLastRefreshed(Date.now());
            setFetchAttempts(prev => prev + 1);
          }, backoffDelay);
        } else {
          toast({
            title: "Error fetching reminders",
            description: "Could not load reminder schedule. Please try refreshing.",
            variant: "destructive",
            duration: 5000
          });
          setFetchAttempts(0); // Reset for future refreshes
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReminders();
  }, [messageId, refreshTrigger, lastRefreshed, fetchAttempts]);
  
  return {
    upcomingReminders,
    hasReminders,
    isLoading,
    forceRefresh,
    lastRefreshed
  };
}
