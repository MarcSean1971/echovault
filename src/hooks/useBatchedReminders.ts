
import { useState, useEffect } from "react";
import { getUpcomingRemindersForMultipleMessages } from "@/utils/reminderScheduler";

interface ReminderInfo {
  messageId: string;
  nextReminder: Date | null;
  formattedNextReminder: string | null;
  hasSchedule: boolean;
  upcomingReminders: string[];
}

interface BatchedReminderResult {
  reminders: Record<string, ReminderInfo>;
  isLoading: boolean;
  lastRefreshed?: number;
  forceRefresh: () => void;
}

/**
 * Hook to efficiently get scheduled reminders for multiple messages in a single query
 * Solves the N+1 query problem by batching reminder fetches
 */
export function useBatchedReminders(
  messageIds: string[],
  refreshTrigger: number = 0
): BatchedReminderResult {
  const [reminderData, setReminderData] = useState<Record<string, ReminderInfo>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [localRefreshCounter, setLocalRefreshCounter] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState<number>(Date.now());

  // Function to force refresh
  const forceRefresh = () => {
    setLocalRefreshCounter(prev => prev + 1);
  };

  useEffect(() => {
    // Skip if no message IDs provided
    if (!messageIds.length) {
      setIsLoading(false);
      return;
    }

    const fetchRemindersForMessages = async () => {
      try {
        setIsLoading(true);
        
        console.log(`[useBatchedReminders] Fetching reminders for ${messageIds.length} messages in batch`);
        const remindersByMessage = await getUpcomingRemindersForMultipleMessages(messageIds);
        
        // Build reminder info map
        const reminderMap: Record<string, ReminderInfo> = {};
        
        messageIds.forEach(messageId => {
          const messageReminders = remindersByMessage[messageId] || [];
          
          // Process the reminders for this message
          let nextReminderDate: Date | null = null;
          if (messageReminders.length > 0) {
            const sortedReminders = [...messageReminders].sort(
              (a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()
            );
            nextReminderDate = sortedReminders[0].scheduledAt;
          }
          
          // Format the reminders for display
          const formattedReminders = messageReminders.map(reminder => {
            const date = new Date(reminder.scheduledAt);
            const formattedDate = date.toLocaleDateString(undefined, { 
              month: 'short', 
              day: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            });
            
            const typeName = reminder.reminderType === 'reminder' ? 'Reminder' : 
                          (reminder.reminderType === 'final_delivery' ? 'Final Delivery' : reminder.reminderType);
            
            const priorityFlag = reminder.priority === 'critical' ? ' (Critical)' : '';
            
            return `${formattedDate} (${typeName}${priorityFlag})`;
          });
          
          // Format next reminder time
          let formattedNextReminder: string | null = null;
          if (nextReminderDate) {
            const now = new Date();
            const diff = nextReminderDate.getTime() - now.getTime();
            
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            if (days > 0) {
              formattedNextReminder = `in ${days}d ${hours}h`;
            } else if (hours > 0) {
              formattedNextReminder = `in ${hours}h ${minutes}m`;
            } else if (minutes > 0) {
              formattedNextReminder = `in ${minutes}m`;
            } else {
              formattedNextReminder = 'very soon';
            }
          }
          
          // Store the processed reminder info for this message
          reminderMap[messageId] = {
            messageId,
            nextReminder: nextReminderDate,
            formattedNextReminder,
            hasSchedule: messageReminders.length > 0,
            upcomingReminders: formattedReminders
          };
        });
        
        console.log(`[useBatchedReminders] Processed reminders for ${Object.keys(reminderMap).length} messages`);
        setReminderData(reminderMap);
        setLastRefreshed(Date.now());
      } catch (error) {
        console.error("[useBatchedReminders] Error fetching batched reminders:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRemindersForMessages();
  }, [messageIds, refreshTrigger, localRefreshCounter]);
  
  return { 
    reminders: reminderData, 
    isLoading,
    lastRefreshed,
    forceRefresh
  };
}
