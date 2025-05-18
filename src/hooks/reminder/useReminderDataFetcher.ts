
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
   * Optimized to use the new database indexes
   */
  const fetchReminderData = async () => {
    if (!messageId) return null;
    setIsLoading(true);
    console.log(`[ReminderDataFetcher] Fetching reminder data for message ${messageId}`);
    
    try {
      // Use Promise.all to run both queries in parallel for better performance
      const [upcomingResult, historyResult, logsResult] = await Promise.all([
        // Query for upcoming reminders using the new index on message_id and status
        supabase
          .from('reminder_schedule')
          .select('*')
          .eq('message_id', messageId)
          .eq('status', 'pending')
          .order('scheduled_at', { ascending: true }),
          
        // Query for reminder history
        supabase
          .from('sent_reminders')
          .select('*')
          .eq('message_id', messageId)
          .order('sent_at', { ascending: false }),
          
        // Query for delivery logs using the new compound index
        supabase
          .from('reminder_delivery_log')
          .select('*')
          .eq('message_id', messageId)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);
      
      // Handle errors from any of the parallel queries
      const upcomingError = upcomingResult.error;
      const historyError = historyResult.error;
      const logsError = logsResult.error;
      
      if (upcomingError) {
        if (upcomingError.code === '42501' || upcomingError.message?.includes('permission denied')) {
          console.warn("[ReminderDataFetcher] Permission denied fetching reminder schedule - user likely doesn't own this message");
          setPermissionError(true);
        } else {
          console.error("[ReminderDataFetcher] Error fetching upcoming reminders:", upcomingError);
        }
        return null;
      }
      
      if (historyError) {
        if (historyError.code === '42501' || historyError.message?.includes('permission denied')) {
          console.warn("[ReminderDataFetcher] Permission denied fetching reminder history - user likely doesn't own this message");
          setPermissionError(true);
        } else {
          console.error("[ReminderDataFetcher] Error fetching reminder history:", historyError);
        }
        return null;
      }
      
      if (logsError && logsError.code !== '42P01') { // Ignore "relation does not exist" errors
        console.warn("[ReminderDataFetcher] Error fetching delivery logs:", logsError);
      } else if (logsResult.data) {
        console.log(`[ReminderDataFetcher] Found ${logsResult.data.length} delivery log entries`);
      }
      
      const upcomingReminders = upcomingResult.data;
      const reminderHistory = historyResult.data;
      
      console.log(`[ReminderDataFetcher] Found ${upcomingReminders?.length || 0} upcoming reminders and ${reminderHistory?.length || 0} reminder history records`);
      
      // Transform reminders to have proper Date objects
      const transformedReminders = upcomingReminders ? transformReminderData(upcomingReminders) : [];
      
      setPermissionError(false);
      return {
        upcomingReminders: transformedReminders,
        reminderHistory: reminderHistory || []
      } as ReminderData;
    } catch (error) {
      console.error("[ReminderDataFetcher] Error in fetchReminderData:", error);
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
