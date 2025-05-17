
import { useState } from "react";
import { getReminderHistory } from "@/services/messages/reminderService";
import { getUpcomingReminders } from "@/utils/reminder";
import { toast } from "@/components/ui/use-toast";
import { ScheduledReminderInfo } from "./types";

/**
 * Hook to fetch reminder data from the API
 */
export function useReminderDataFetcher(messageId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  
  /**
   * Fetch reminder data from multiple sources
   */
  const fetchReminderData = async (): Promise<{
    upcomingReminders: any[];
    reminderHistory: any[];
  } | null> => {
    if (!messageId) return null;
    
    try {
      console.log(`[useReminderDataFetcher] Fetching reminder data for message ${messageId}`);
      setIsLoading(true);
      setPermissionError(false);
      
      // Get upcoming reminders from the schedule
      const upcomingReminders = await getUpcomingReminders(messageId);
      console.log(`[useReminderDataFetcher] Found ${upcomingReminders.length} upcoming reminders`);
      
      // Get reminder history for last reminders
      const reminderHistory = await getReminderHistory(messageId);
      
      return { upcomingReminders, reminderHistory };
    } catch (error: any) {
      console.error("[useReminderDataFetcher] Error fetching reminder data:", error);
      
      // Check if this is an RLS permission error
      const isPermissionError = error?.code === "42501" || error?.message?.includes("permission denied");
      
      if (isPermissionError) {
        console.warn("[useReminderDataFetcher] Permission denied accessing reminders - user likely doesn't own this message");
        
        toast({
          title: "Permission Error",
          description: "You don't have permission to view reminders for this message.",
          variant: "destructive",
          duration: 5000
        });
        
        setPermissionError(true);
      }
      
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
