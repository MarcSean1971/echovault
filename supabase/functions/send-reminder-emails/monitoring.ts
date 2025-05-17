
import { supabaseClient } from "./supabase-client.ts";

interface MonitoringStatus {
  dueReminders: number;
  sentLastFiveMin: number;
  failedLastFiveMin: number;
}

/**
 * Get monitoring status information for the reminder service
 */
export async function getMonitoringStatus(): Promise<MonitoringStatus> {
  try {
    const supabase = supabaseClient();
    
    // Get counts from the view we created
    const { data, error } = await supabase
      .from('reminder_schedule_status')
      .select('*')
      .limit(1)
      .single();
    
    if (error) {
      console.error("Error getting monitoring status:", error);
      return {
        dueReminders: 0,
        sentLastFiveMin: 0,
        failedLastFiveMin: 0
      };
    }
    
    return {
      dueReminders: data?.due_reminders || 0,
      sentLastFiveMin: data?.sent_last_5min || 0,
      failedLastFiveMin: data?.failed_last_5min || 0
    };
  } catch (error) {
    console.error("Error in getMonitoringStatus:", error);
    return {
      dueReminders: 0,
      sentLastFiveMin: 0,
      failedLastFiveMin: 0
    };
  }
}

/**
 * Record an alert for critical failures
 */
export async function recordServiceAlert(
  type: string,
  message: string,
  details?: any
): Promise<void> {
  try {
    // For now, just log to console
    // In a production system, this would send to an alert system
    console.error(`ALERT [${type}]: ${message}`);
    if (details) {
      console.error(JSON.stringify(details, null, 2));
    }
    
    // TODO: Implement actual alerting mechanism (e.g., PagerDuty, Slack, etc.)
  } catch (error) {
    console.error("Error in recordServiceAlert:", error);
  }
}
