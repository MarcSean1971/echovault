
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ReminderItem {
  scheduledAt: Date;
  reminderType: string;
  priority?: string;
  id: string;
  message_id: string;
  condition_id: string;
  status: string;
}

interface SentReminderItem {
  id: string;
  message_id: string;
  condition_id: string;
  sent_at: string;
  deadline: string;
  scheduled_for?: string | null;
}

interface ReminderData {
  upcomingReminders: ReminderItem[];
  reminderHistory: SentReminderItem[];
}

export function useReminderDataFetcher(messageId: string | null | undefined) {
  const [isLoading, setIsLoading] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  
  /**
   * Transform database reminder objects to the format expected by the formatter
   */
  const transformReminderData = (reminders: any[]): ReminderItem[] => {
    return reminders.map(reminder => ({
      id: reminder.id,
      message_id: reminder.message_id,
      condition_id: reminder.condition_id,
      scheduledAt: new Date(reminder.scheduled_at), // Convert to Date object
      reminderType: reminder.reminder_type,
      priority: reminder.delivery_priority,
      status: reminder.status
    }));
  };
  
  /**
   * Fetch all reminder data for a message
   * This includes both scheduled and sent reminders
   */
  const fetchReminderData = async () => {
    if (!messageId) return null;
    setIsLoading(true);
    
    try {
      // First fetch upcoming reminders
      const { data: upcomingReminders, error: upcomingError } = await supabase
        .from('reminder_schedule')
        .select('*')
        .eq('message_id', messageId)
        .eq('status', 'pending')
        .order('scheduled_at', { ascending: true });
        
      if (upcomingError) {
        if (upcomingError.code === '42501' || upcomingError.message?.includes('permission denied')) {
          console.warn("Permission denied fetching reminder schedule - user likely doesn't own this message");
          setPermissionError(true);
        } else {
          console.error("Error fetching upcoming reminders:", upcomingError);
        }
        return null;
      }
      
      // Then fetch reminder history
      const { data: reminderHistory, error: historyError } = await supabase
        .from('sent_reminders')
        .select('*')
        .eq('message_id', messageId)
        .order('sent_at', { ascending: false });
        
      if (historyError) {
        if (historyError.code === '42501' || historyError.message?.includes('permission denied')) {
          console.warn("Permission denied fetching reminder history - user likely doesn't own this message");
          setPermissionError(true);
        } else {
          console.error("Error fetching reminder history:", historyError);
        }
        return null;
      }
      
      console.log(`[ReminderDataFetcher] Found ${upcomingReminders?.length || 0} upcoming reminders and ${reminderHistory?.length || 0} reminder history records`);
      
      // Transform reminders to have proper Date objects
      const transformedReminders = upcomingReminders ? transformReminderData(upcomingReminders) : [];
      
      setPermissionError(false);
      return {
        upcomingReminders: transformedReminders,
        reminderHistory: reminderHistory || []
      } as ReminderData;
    } catch (error) {
      console.error("Error in fetchReminderData:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    fetchReminderData,
    isLoading,
    permissionError
  };
}
