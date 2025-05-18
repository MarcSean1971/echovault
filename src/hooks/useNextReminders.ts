
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export function useNextReminders(messageId?: string | null, refreshTrigger: number = 0) {
  const [upcomingReminders, setUpcomingReminders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasReminders, setHasReminders] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<number>(0);
  const [permissionError, setPermissionError] = useState(false);

  const formatReminderTimeString = (scheduledAt: string): string => {
    try {
      const date = new Date(scheduledAt);
      const now = new Date();
      const diffMs = date.getTime() - now.getTime();
      const diffMins = Math.round(diffMs / 60000);
      
      if (diffMins < 0) {
        return "Overdue";
      } else if (diffMins < 60) {
        return `In ${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
      } else if (diffMins < 1440) { // Less than 24 hours
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return `In ${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
      } else {
        // Format as date for times more than 24 hours away
        const options: Intl.DateTimeFormatOptions = { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit'
        };
        return date.toLocaleDateString(undefined, options);
      }
    } catch (e) {
      console.error("Error formatting reminder time:", e);
      return "Invalid date";
    }
  };

  const fetchReminders = async () => {
    if (!messageId) {
      setUpcomingReminders([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Query for scheduled reminders
      const { data: scheduledReminders, error: scheduleError } = await supabase
        .from('reminder_schedule')
        .select('*')
        .eq('message_id', messageId)
        .eq('status', 'pending')
        .order('scheduled_at', { ascending: true });
        
      if (scheduleError) {
        if (scheduleError.code === '42501' || scheduleError.message?.includes('permission denied')) {
          console.log("Permission error fetching reminders - user likely doesn't own this message");
          setPermissionError(true);
        } else {
          console.error("Error fetching scheduled reminders:", scheduleError);
        }
        
        setUpcomingReminders([]);
        setHasReminders(false);
        setIsLoading(false);
        return;
      }
      
      // Format the reminders into user-friendly strings
      const formattedReminders = (scheduledReminders || []).map(reminder => {
        const timeText = formatReminderTimeString(reminder.scheduled_at);
        const isCritical = reminder.reminder_type === 'final_delivery';
        
        if (isCritical) {
          return `Final Delivery (${timeText})`;
        } else {
          return `Reminder: ${timeText}`;
        }
      });
      
      console.log(`[useNextReminders] Found ${formattedReminders.length} upcoming reminders`);
      setUpcomingReminders(formattedReminders);
      setHasReminders(scheduledReminders && scheduledReminders.length > 0);
      setPermissionError(false);
    } catch (error) {
      console.error("Error in useNextReminders:", error);
      setUpcomingReminders([]);
      setHasReminders(false);
    } finally {
      setIsLoading(false);
      setLastRefreshed(Date.now());
    }
  };

  const forceRefresh = () => {
    console.log("[useNextReminders] Force refreshing reminders");
    fetchReminders();
  };

  useEffect(() => {
    fetchReminders();
    
    // Add listener for condition updates
    const handleConditionUpdated = () => {
      console.log("[useNextReminders] Received conditions-updated event, refreshing");
      fetchReminders();
    };
    
    window.addEventListener('conditions-updated', handleConditionUpdated);
    
    return () => {
      window.removeEventListener('conditions-updated', handleConditionUpdated);
    };
  }, [messageId, refreshTrigger]);

  return { 
    upcomingReminders, 
    isLoading, 
    hasReminders, 
    forceRefresh, 
    lastRefreshed,
    permissionError
  };
}
