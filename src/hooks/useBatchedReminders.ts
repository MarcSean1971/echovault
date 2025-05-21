
import { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import { getUpcomingRemindersForMultipleMessages } from "@/utils/reminder/reminderFetcher";

export function useBatchedReminders(
  messageIds: string[], 
  refreshTrigger: number = 0
) {
  const [remindersData, setRemindersData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const fetchTimeoutRef = useRef<number | null>(null);
  const previousMessageIdsRef = useRef<string[]>([]);
  const lastFetchTimeRef = useRef<number>(0);
  
  // Format reminders for a message
  const formatReminder = useCallback((messageId: string, reminders: Array<{
    scheduledAt: Date;
    reminderType: string;
    priority?: string;
  }>) => {
    // If no reminders, return null data
    if (!reminders || reminders.length === 0) {
      return {
        messageId,
        nextReminder: null,
        formattedNextReminder: null,
        hasSchedule: false,
        upcomingReminders: []
      };
    }
    
    // Get next reminder (first in the array, they are already sorted)
    const nextReminder = reminders[0]?.scheduledAt;
    
    // Format for display
    const formattedNextReminder = nextReminder ? 
      format(nextReminder, 'MMM d, h:mm a') : 
      null;
    
    // Format all upcoming reminders for tooltip
    const upcomingReminders = reminders.map(r => 
      format(r.scheduledAt, 'MMM d, h:mm a')
    );
    
    return {
      messageId,
      nextReminder,
      formattedNextReminder,
      hasSchedule: true,
      upcomingReminders
    };
  }, []);
  
  // Debounced load reminders data function
  const debouncedLoadReminders = useCallback(() => {
    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      window.clearTimeout(fetchTimeoutRef.current);
    }
    
    // Set a new timeout to prevent rapid consecutive calls
    fetchTimeoutRef.current = window.setTimeout(async () => {
      // Rate limit fetches to once every 5 seconds at most
      const now = Date.now();
      if (now - lastFetchTimeRef.current < 5000) {
        return;
      }
      
      // Skip if no message IDs
      if (!messageIds || messageIds.length === 0) {
        setRemindersData({});
        setIsLoading(false);
        return;
      }
      
      // Skip if message IDs are the same as before (prevent unnecessary fetches)
      if (previousMessageIdsRef.current.length === messageIds.length && 
          previousMessageIdsRef.current.every((id, idx) => id === messageIds[idx]) &&
          Object.keys(remindersData).length > 0) {
        return;
      }
      
      setIsLoading(true);
      lastFetchTimeRef.current = now;
      previousMessageIdsRef.current = [...messageIds];
      
      try {
        // Use the optimized batch fetcher
        const remindersByMessage = await getUpcomingRemindersForMultipleMessages(messageIds);
        
        // Format each message's reminders
        const formattedReminders: Record<string, any> = {};
        
        // Process each message ID to ensure all messages have an entry
        messageIds.forEach(id => {
          const messageReminders = remindersByMessage[id] || [];
          formattedReminders[id] = formatReminder(id, messageReminders);
        });
        
        // Update state with the new data
        setRemindersData(prev => {
          // Only update if there are actual changes to avoid unnecessary re-renders
          const hasChanges = messageIds.some(id => {
            if (!prev[id] || !formattedReminders[id]) return true;
            if (prev[id].formattedNextReminder !== formattedReminders[id].formattedNextReminder) return true;
            if (prev[id].upcomingReminders.length !== formattedReminders[id].upcomingReminders.length) return true;
            return false;
          });
          
          return hasChanges ? formattedReminders : prev;
        });
      } catch (error) {
        console.error("Error loading batched reminders:", error);
        // Only create empty data for IDs that don't have data yet
        setRemindersData(prev => {
          const updatedData = {...prev};
          messageIds.forEach(id => {
            if (!updatedData[id]) {
              updatedData[id] = formatReminder(id, []);
            }
          });
          return updatedData;
        });
      } finally {
        setIsLoading(false);
      }
    }, 300); // Debounce for 300ms
  }, [messageIds, formatReminder, remindersData]);
  
  // Load reminders initially and when refresh is triggered
  useEffect(() => {
    debouncedLoadReminders();
    
    // Clean up timeout on unmount
    return () => {
      if (fetchTimeoutRef.current) {
        window.clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [debouncedLoadReminders, refreshTrigger]);
  
  // Force refresh function
  const forceRefresh = useCallback(() => {
    // Reset the last fetch time to force a fresh fetch
    lastFetchTimeRef.current = 0;
    debouncedLoadReminders();
  }, [debouncedLoadReminders]);
  
  return { 
    reminders: remindersData,
    isLoading,
    forceRefresh
  };
}
