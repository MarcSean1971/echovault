
import { useState, useEffect, useCallback } from 'react';
import { getUpcomingReminders } from '@/utils/reminderScheduler';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/components/ui/use-toast';

interface ReminderInfo {
  formattedText: string;
  formattedShortDate: string;
  isImportant: boolean;
}

export function useNextReminders(messageId?: string, refreshTrigger: number = 0) {
  const [upcomingReminders, setUpcomingReminders] = useState<ReminderInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(0);
  const [permissionError, setPermissionError] = useState(false);
  const [reminderData, setReminderData] = useState<{
    messageId: string | undefined;
    nextReminder: Date | null;
    formattedNextReminder: string | null;
    hasSchedule: boolean;
    upcomingReminders: string[];
  }>({
    messageId: undefined,
    nextReminder: null,
    formattedNextReminder: null,
    hasSchedule: false,
    upcomingReminders: []
  });

  const fetchReminders = useCallback(async () => {
    if (!messageId) {
      setUpcomingReminders([]);
      setReminderData({
        messageId: undefined,
        nextReminder: null,
        formattedNextReminder: null,
        hasSchedule: false,
        upcomingReminders: []
      });
      return;
    }

    setIsLoading(true);
    setPermissionError(false);
    
    try {
      const reminderItems = await getUpcomingReminders(messageId);
      
      const formattedReminders = reminderItems
        .map(reminder => {
          const now = new Date();
          const scheduledAt = reminder.scheduledAt;
          const isImportant = 
            reminder.priority === 'critical' || 
            scheduledAt.getTime() - now.getTime() < 60 * 60 * 1000; // 1 hour
            
          const formattedText = `${formatDistanceToNow(scheduledAt, { addSuffix: true })} - ${reminder.reminderType === 'final_delivery' ? 'Final Delivery' : 'Reminder'}`;
          
          // Format short date to show in badge
          // For dates less than 24 hours away, show hours or minutes
          // For dates more than 24 hours away, show the day
          const formattedShortDate = scheduledAt.getTime() - now.getTime() < 24 * 60 * 60 * 1000
            ? formatDistanceToNow(scheduledAt, { addSuffix: false })
            : scheduledAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            
          return {
            formattedText,
            formattedShortDate,
            isImportant
          };
        });
        
      setUpcomingReminders(formattedReminders);
      
      // Also set the reminderData in the new format for consistency
      const hasSchedule = reminderItems.length > 0;
      const nextReminder = hasSchedule ? reminderItems[0]?.scheduledAt : null;
      const formattedNextReminder = nextReminder 
        ? formatDistanceToNow(nextReminder, { addSuffix: true }) 
        : null;
      
      // Format all reminders as strings for the new interface
      const upcomingReminderTexts = reminderItems.map(r => {
        const typeLabel = r.reminderType === 'final_delivery' ? 'Final Delivery' : 'Reminder';
        const priorityLabel = r.priority === 'critical' ? ' (Critical)' : '';
        return `${formatDistanceToNow(r.scheduledAt, { addSuffix: true })} - ${typeLabel}${priorityLabel}`;
      });
      
      setReminderData({
        messageId,
        nextReminder,
        formattedNextReminder,
        hasSchedule,
        upcomingReminders: upcomingReminderTexts
      });
      
      setLastRefreshed(Date.now());
    } catch (error: any) {
      console.error('Error fetching reminders:', error);
      
      // Check if this is a permission error due to RLS
      const isPermissionError = 
        error.code === "42501" || 
        error.message?.includes("permission denied") ||
        error.message?.includes("access denied");
      
      if (isPermissionError) {
        console.warn('Permission denied accessing reminder data. User likely does not own this message.');
        setPermissionError(true);
        
        // Only show the toast once
        if (!permissionError) {
          toast({
            title: "Permission Error",
            description: "You don't have permission to view reminders for this message.",
            variant: "destructive",
            duration: 5000
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Could not load reminder data. Please try again later.",
          variant: "destructive",
          duration: 3000
        });
      }
      
      // Clear the data on error
      setUpcomingReminders([]);
      setReminderData({
        messageId,
        nextReminder: null,
        formattedNextReminder: null,
        hasSchedule: false,
        upcomingReminders: []
      });
    } finally {
      setIsLoading(false);
    }
  }, [messageId, permissionError]);

  // Force a refresh of the data
  const forceRefresh = useCallback(() => {
    fetchReminders();
  }, [fetchReminders]);

  // Fetch data on initial load and when messageId or refreshTrigger changes
  useEffect(() => {
    fetchReminders();
  }, [messageId, refreshTrigger, fetchReminders]);

  // Calculate if we have any reminders to show
  const hasReminders = upcomingReminders.length > 0;

  return {
    upcomingReminders,
    isLoading,
    hasReminders,
    forceRefresh,
    lastRefreshed,
    permissionError,
    reminderData
  };
}
