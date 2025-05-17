
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { generateReminderSchedule, generateCheckInReminderSchedule } from "@/utils/reminderScheduler";

// Define a type for the reminder schedule options
interface ReminderScheduleOptions {
  messageId: string;
  conditionId: string;
  conditionType: string;
  triggerDate: string | null;
  reminderMinutes: number[];
  lastChecked?: string | null;
  hoursThreshold?: number;
  minutesThreshold?: number;
}

/**
 * Trigger reminder check with the new schedule-based system
 */
export async function triggerReminderCheck(messageId: string, forceSend: boolean = true) {
  try {
    console.log(`Triggering reminder check for message ${messageId}, forceSend: ${forceSend}`);
    
    // Call the updated edge function
    const { data, error } = await supabase.functions.invoke("send-reminder-emails", {
      body: { 
        messageId,
        debug: true,
        forceSend,
        action: 'process'
      }
    });
    
    if (error) throw error;
    
    if (data && data.results && data.results.successful > 0) {
      toast({
        title: "Reminders sent",
        description: `Successfully sent ${data.results.successful} reminder(s) for this message`,
        duration: 5000,
      });
    } else {
      toast({
        title: "No reminders sent",
        description: data?.results?.skipped > 0 
          ? "Reminders were queued for retry" 
          : (data?.message || "No reminders needed at this time"),
        duration: 5000,
      });
    }
    
    return data;
  } catch (error: any) {
    console.error("Error triggering reminder check:", error);
    toast({
      title: "Error",
      description: "Failed to trigger reminder check: " + (error.message || "Unknown error"),
      variant: "destructive",
      duration: 5000
    });
    throw error;
  }
}

/**
 * Create or update reminder schedule based on message condition
 */
export async function createOrUpdateReminderSchedule(options: ReminderScheduleOptions): Promise<boolean> {
  try {
    console.log(`Creating/updating reminder schedule for message ${options.messageId}`);
    console.log(`Condition type: ${options.conditionType}`);
    
    if (['no_check_in', 'recurring_check_in', 'inactivity_to_date'].includes(options.conditionType)) {
      // For check-in type conditions, use last checked date + threshold
      if (!options.lastChecked) {
        console.warn("No last checked date for check-in condition, can't create schedule");
        return false;
      }
      
      if (options.hoursThreshold === undefined) {
        console.warn("No hours threshold for check-in condition, can't create schedule");
        return false;
      }
      
      const result = await generateCheckInReminderSchedule(
        options.messageId,
        options.conditionId,
        options.lastChecked ? new Date(options.lastChecked) : null,
        options.hoursThreshold || 0,
        options.minutesThreshold || 0,
        options.reminderMinutes
      );
      
      // Invalidate condition cache to force refresh
      if (result) {
        try {
          const { data: userData } = await supabase.auth.getUser();
          if (userData && userData.user) {
            // Import dynamically to avoid circular dependencies
            const { invalidateConditionsCache } = await import('./conditions/dbOperations');
            invalidateConditionsCache(userData.user.id);
          }
        } catch (err) {
          console.error("Failed to invalidate conditions cache:", err);
        }
      }
      
      return result;
    } else {
      // For normal conditions with trigger date
      return await generateReminderSchedule(
        options.messageId,
        options.conditionId,
        options.triggerDate ? new Date(options.triggerDate) : null,
        options.reminderMinutes
      );
    }
  } catch (error) {
    console.error("Error creating reminder schedule:", error);
    return false;
  }
}

/**
 * Get reminder history for a specific message (keeping original function)
 */
export interface Reminder {
  id: string;
  condition_id: string;
  message_id: string;
  user_id: string;
  sent_at: string;
  deadline: string;
  created_at: string;
  scheduled_for?: string;
}

export async function getReminderHistory(messageId: string): Promise<Reminder[]> {
  try {
    // Use direct fetch to bypass TypeScript's table type checking
    const response = await supabase.auth.getSession();
    const authToken = response.data.session?.access_token;
    
    // Get the URL from the Supabase instance without accessing protected properties
    const projectRef = 'onwthrpgcnfydxzzmyot';
    const url = `https://${projectRef}.supabase.co/rest/v1/sent_reminders?message_id=eq.${messageId}&order=sent_at.desc`;
    
    // The anon key is in supabase/config.toml
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ud3RocnBnY25meWR4enpteW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDQzOTUsImV4cCI6MjA2MTY4MDM5NX0.v4tYEDukTlMERZ6GHqvnoDbyH-g9KQd8s3-UlIOPkDs';
    
    const fetchResponse = await fetch(url, {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!fetchResponse.ok) {
      throw new Error(`HTTP error: ${fetchResponse.status}`);
    }
    
    const fetchData = await fetchResponse.json();
    return fetchData as Reminder[];
  } catch (error: any) {
    console.error("Error fetching reminder history:", error);
    throw error;
  }
}

/**
 * Get monitoring status for the reminder service
 */
export async function getReminderServiceStatus(): Promise<{
  dueReminders: number;
  sentLastFiveMin: number;
  failedLastFiveMin: number;
}> {
  try {
    const { data, error } = await supabase.functions.invoke("send-reminder-emails", {
      body: { action: 'status' }
    });
    
    if (error) throw error;
    
    return data?.status || { dueReminders: 0, sentLastFiveMin: 0, failedLastFiveMin: 0 };
  } catch (error) {
    console.error("Error getting reminder service status:", error);
    return { dueReminders: 0, sentLastFiveMin: 0, failedLastFiveMin: 0 };
  }
}
