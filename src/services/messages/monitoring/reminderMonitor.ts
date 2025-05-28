import { supabase } from "@/integrations/supabase/client";

/**
 * Enhanced reminder monitoring service with improved reset and retry logic
 */
export class ReminderMonitor {
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Start monitoring reminders
   */
  start() {
    console.log("[REMINDER-MONITOR] Starting reminder monitoring service");
    
    // Check every 30 seconds
    this.intervalId = setInterval(() => {
      this.checkMissedReminders();
    }, 30000);
    
    // Run initial check
    this.checkMissedReminders();
  }

  /**
   * Alias for start() method - used by some components
   */
  startMonitoring() {
    this.start();
  }

  /**
   * Stop monitoring reminders
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("[REMINDER-MONITOR] Stopped reminder monitoring service");
    }
  }

  /**
   * Check for missed reminders and process them with enhanced reset logic
   */
  private async checkMissedReminders() {
    try {
      console.log("[REMINDER-MONITOR] Checking for missed reminders...");
      
      // First trigger a reset to handle failed reminders and create new ones
      await supabase.functions.invoke("send-reminder-emails", {
        body: {
          debug: true,
          action: "reset"
        }
      });
      
      // Then trigger reminder processing
      await supabase.functions.invoke("send-reminder-emails", {
        body: {
          debug: true,
          action: "process",
          forceSend: false
        }
      });
      
    } catch (error) {
      console.error("[REMINDER-MONITOR] Error in checkMissedReminders:", error);
    }
  }

  /**
   * Force process reminders for a specific message with reset
   */
  async forceProcessMessageReminders(messageId: string): Promise<void> {
    try {
      console.log(`[REMINDER-MONITOR] Force processing reminders for message: ${messageId}`);
      
      // First reset and create new reminders
      await supabase.functions.invoke("send-reminder-emails", {
        body: {
          debug: true,
          action: "reset"
        }
      });
      
      // Then force process for this specific message
      await supabase.functions.invoke("send-reminder-emails", {
        body: {
          messageId: messageId,
          debug: true,
          forceSend: true,
          source: "force-process-monitor",
          action: "process"
        }
      });
      
      console.log(`[REMINDER-MONITOR] Successfully triggered force processing for message: ${messageId}`);
      
    } catch (error) {
      console.error(`[REMINDER-MONITOR] Error in forceProcessMessageReminders for ${messageId}:`, error);
    }
  }

  /**
   * Force process all due reminders with reset
   */
  async forceProcessAllReminders(): Promise<void> {
    try {
      console.log("[REMINDER-MONITOR] Force processing all due reminders");
      
      // First reset and create new reminders
      await supabase.functions.invoke("send-reminder-emails", {
        body: {
          debug: true,
          action: "reset"
        }
      });
      
      // Then force process all reminders
      await supabase.functions.invoke("send-reminder-emails", {
        body: {
          debug: true,
          forceSend: true,
          source: "force-process-all-reminders",
          action: "process"
        }
      });
      
      console.log("[REMINDER-MONITOR] Successfully triggered force processing for all reminders");
      
    } catch (error) {
      console.error("[REMINDER-MONITOR] Error in forceProcessAllReminders:", error);
    }
  }

  /**
   * Manual reset of failed reminders and creation of new ones
   */
  async manualResetAndCreateReminders(): Promise<void> {
    try {
      console.log("[REMINDER-MONITOR] Manual reset and create reminders requested");
      
      const { data, error } = await supabase.functions.invoke("send-reminder-emails", {
        body: {
          debug: true,
          action: "reset"
        }
      });
      
      if (error) {
        console.error("[REMINDER-MONITOR] Error in manual reset:", error);
      } else {
        console.log("[REMINDER-MONITOR] Manual reset completed:", data);
      }
      
    } catch (error) {
      console.error("[REMINDER-MONITOR] Error in manualResetAndCreateReminders:", error);
    }
  }

  /**
   * Get system statistics for reminders
   */
  async getSystemStats(): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_system_reminder_stats');
      
      if (error) {
        console.error("[REMINDER-MONITOR] Error getting system stats:", error);
        return null;
      }
      
      return data?.[0] || null;
    } catch (error) {
      console.error("[REMINDER-MONITOR] Error in getSystemStats:", error);
      return null;
    }
  }
}

// Export singleton instance
export const reminderMonitor = new ReminderMonitor();
