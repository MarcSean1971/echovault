
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
  const [localRefreshCounter, setLocalRefreshCounter] = useState(0);
  
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
  
  // Force refresh function - now directly exposed for external use
  const forceRefresh = useCallback(() => {
    console.log("[useBatchedReminders] Forcing a complete refresh of reminder data");
    // Reset the last fetch time to force a fresh fetch
    lastFetchTimeRef.current = 0;
    // Increment local refresh counter to trigger a new fetch
    setLocalRefreshCounter(prev => prev + 1);
  }, []);
  
  // Debounced load reminders data function
  const debouncedLoadReminders = useCallback(() => {
    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      window.clearTimeout(fetchTimeoutRef.current);
    }
    
    // Set a new timeout to prevent rapid consecutive calls
    fetchTimeoutRef.current = window.setTimeout(async () => {
      // Rate limit fetches to once every 3 seconds at most (reduced from 5s)
      const now = Date.now();
      if (now - lastFetchTimeRef.current < 3000) {
        return;
      }
      
      // Skip if no message IDs
      if (!messageIds || messageIds.length === 0) {
        setRemindersData({});
        setIsLoading(false);
        return;
      }
      
      // Skip if message IDs are the same as before and no refresh was requested
      const noRefreshNeeded = previousMessageIdsRef.current.length === messageIds.length && 
          previousMessageIdsRef.current.every((id, idx) => id === messageIds[idx]) &&
          Object.keys(remindersData).length > 0;
          
      if (noRefreshNeeded && localRefreshCounter === 0 && refreshTrigger === 0) {
        return;
      }
      
      console.log(`[useBatchedReminders] Fetching reminders for ${messageIds.length} messages`);
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
        setRemindersData(formattedReminders);
      } catch (error) {
        console.error("[useBatchedReminders] Error loading batched reminders:", error);
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
    }, 200); // Reduced debounce time from 300ms to 200ms for faster updates
  }, [messageIds, formatReminder, remindersData, localRefreshCounter, refreshTrigger]);
  
  // Load reminders initially and when refresh is triggered
  useEffect(() => {
    debouncedLoadReminders();
    
    // Clean up timeout on unmount
    return () => {
      if (fetchTimeoutRef.current) {
        window.clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [debouncedLoadReminders, refreshTrigger, localRefreshCounter]);
  
  // NEW: Listen for condition-updated events to immediately refresh relevant reminders
  useEffect(() => {
    const handleConditionsUpdated = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      
      const detail = event.detail || {};
      const { messageId, action, optimistic } = detail;
      
      // Only react to confirmed updates (not optimistic) to avoid double refreshes
      if (optimistic) return;
      
      // If this is a message we're displaying and it was armed, force refresh
      if (messageId && messageIds.includes(messageId)) {
        console.log(`[useBatchedReminders] Received conditions-updated event for tracked message ${messageId}, action: ${action}, forcing refresh`);
        forceRefresh();
      } else if (!messageId) {
        // For global updates with no specific messageId, also refresh
        console.log(`[useBatchedReminders] Received global conditions-updated event, forcing refresh`);
        forceRefresh();
      }
    };
    
    window.addEventListener('conditions-updated', handleConditionsUpdated);
    return () => {
      window.removeEventListener('conditions-updated', handleConditionsUpdated);
    };
  }, [messageIds, forceRefresh]);

  return { 
    reminders: remindersData,
    isLoading,
    forceRefresh
  };
}
