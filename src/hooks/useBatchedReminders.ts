
import { useState, useEffect, useCallback } from "react";
import { getUpcomingRemindersForMultipleMessages } from "@/utils/reminderScheduler";
import { toast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";

/**
 * Hook that fetches reminders for multiple messages in a single batch query
 * This eliminates the N+1 query issue where we'd otherwise make a separate query for each message
 */
export function useBatchedReminders(messageIds: string[], refreshTrigger: number = 0) {
  const [reminders, setReminders] = useState<Record<string, {
    messageId: string;
    nextReminder: Date | null;
    formattedNextReminder: string | null;
    hasSchedule: boolean;
    upcomingReminders: string[];
  }>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(0);
  
  // Function to force a refresh of the data
  const forceRefresh = useCallback(() => {
    console.log('[useBatchedReminders] Force refreshing reminder data');
    setLastRefreshed(Date.now());
  }, []);
  
  // Fetch reminders when messageIds or refreshTrigger changes
  useEffect(() => {
    if (!messageIds || messageIds.length === 0) {
      setReminders({});
      return;
    }
    
    const fetchReminders = async () => {
      setIsLoading(true);
      setPermissionError(false);
      
      try {
        console.log(`[useBatchedReminders] Fetching reminders for ${messageIds.length} messages`);
        const reminderData = await getUpcomingRemindersForMultipleMessages(messageIds);
        
        // Transform the data to match the expected format
        const transformedData: Record<string, {
          messageId: string;
          nextReminder: Date | null;
          formattedNextReminder: string | null;
          hasSchedule: boolean;
          upcomingReminders: string[];
        }> = {};
        
        // Process each message ID
        messageIds.forEach(messageId => {
          const messageReminders = reminderData[messageId] || [];
          const hasSchedule = messageReminders.length > 0;
          const nextReminder = hasSchedule ? messageReminders[0]?.scheduledAt : null;
          const formattedNextReminder = nextReminder 
            ? formatDistanceToNow(nextReminder, { addSuffix: true }) 
            : null;
          
          // Format all reminders as strings
          const upcomingReminders = messageReminders.map(r => {
            const typeLabel = r.reminderType === 'final_delivery' ? 'Final Delivery' : 'Reminder';
            const priorityLabel = r.priority === 'critical' ? ' (Critical)' : '';
            return `${formatDistanceToNow(r.scheduledAt, { addSuffix: true })} - ${typeLabel}${priorityLabel}`;
          });
          
          transformedData[messageId] = {
            messageId,
            nextReminder,
            formattedNextReminder,
            hasSchedule,
            upcomingReminders
          };
        });
        
        setReminders(transformedData);
        setLastRefreshed(Date.now());
      } catch (error: any) {
        console.error('[useBatchedReminders] Error fetching reminders:', error);
        
        // Check if this is an RLS permission error
        const isPermissionError = error?.code === "42501" || 
                                error?.message?.includes("permission denied") ||
                                error?.message?.includes("access denied");
        
        if (isPermissionError && !permissionError) {
          setPermissionError(true);
          
          // Only show toast once
          toast({
            title: "Permission Error",
            description: "You don't have permission to view some reminder data.",
            variant: "destructive",
            duration: 3000
          });
        }
        
        // Return empty object on error
        setReminders({});
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReminders();
  }, [messageIds, refreshTrigger, lastRefreshed, permissionError]);
  
  // Listen for global condition updates to refresh data
  useEffect(() => {
    const handleConditionsUpdated = () => {
      forceRefresh();
    };
    
    window.addEventListener('conditions-updated', handleConditionsUpdated);
    
    return () => {
      window.removeEventListener('conditions-updated', handleConditionsUpdated);
    };
  }, [forceRefresh]);
  
  return {
    reminders,
    isLoading,
    forceRefresh,
    permissionError
  };
}
