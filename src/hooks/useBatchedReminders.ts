
import { useState, useEffect, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { getUpcomingRemindersForMultipleMessages } from "@/utils/reminder/reminderFetcher";

export function useBatchedReminders(
  messageIds: string[], 
  refreshTrigger: number = 0
) {
  const [remindersData, setRemindersData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  
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
  
  // Load reminders data
  const loadReminders = useCallback(async () => {
    // Skip if no message IDs
    if (!messageIds || messageIds.length === 0) {
      setRemindersData({});
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
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
      
      setRemindersData(formattedReminders);
    } catch (error) {
      console.error("Error loading batched reminders:", error);
      // Initialize empty data for all messages
      const emptyReminders: Record<string, any> = {};
      messageIds.forEach(id => {
        emptyReminders[id] = formatReminder(id, []);
      });
      setRemindersData(emptyReminders);
    } finally {
      setIsLoading(false);
    }
  }, [messageIds, formatReminder]);
  
  // Load reminders initially and when refresh is triggered
  useEffect(() => {
    loadReminders();
  }, [loadReminders, refreshTrigger]);
  
  // Force refresh function
  const forceRefresh = useCallback(() => {
    loadReminders();
  }, [loadReminders]);
  
  return { 
    reminders: remindersData,
    isLoading,
    forceRefresh
  };
}
