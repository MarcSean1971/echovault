
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Enhanced reminder monitoring service to detect and fix issues
 */
class ReminderMonitor {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private stuckCheckInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  /**
   * Start comprehensive monitoring
   */
  startMonitoring() {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    console.log("[REMINDER-MONITOR] Starting enhanced reminder monitoring");

    // Check every 30 seconds for stuck reminders (more frequent)
    this.stuckCheckInterval = setInterval(async () => {
      try {
        await this.checkAndFixStuckReminders();
      } catch (error) {
        console.error("[REMINDER-MONITOR] Error checking stuck reminders:", error);
      }
    }, 30000);

    // Check every 2 minutes for due reminders that haven't been processed
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkForMissedReminders();
      } catch (error) {
        console.error("[REMINDER-MONITOR] Error checking missed reminders:", error);
      }
    }, 120000);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    if (this.stuckCheckInterval) {
      clearInterval(this.stuckCheckInterval);
      this.stuckCheckInterval = null;
    }
    this.isMonitoring = false;
    console.log("[REMINDER-MONITOR] Stopped reminder monitoring");
  }

  /**
   * Check for and automatically fix stuck reminders
   */
  private async checkAndFixStuckReminders() {
    try {
      const { error } = await supabase.functions.invoke("send-reminder-emails", {
        body: {
          action: "fix-stuck",
          debug: true,
          source: "auto-monitor"
        }
      });

      if (error) {
        console.error("[REMINDER-MONITOR] Error auto-fixing stuck reminders:", error);
      }
    } catch (error) {
      console.error("[REMINDER-MONITOR] Exception auto-fixing stuck reminders:", error);
    }
  }

  /**
   * Check for reminders that should have been processed but weren't
   */
  private async checkForMissedReminders() {
    try {
      console.log("[REMINDER-MONITOR] Checking for missed reminders...");
      
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      
      // Find reminders that are overdue but still pending
      const { data: overdueReminders, error } = await supabase
        .from('reminder_schedule')
        .select('id, message_id, scheduled_at, reminder_type')
        .eq('status', 'pending')
        .lt('scheduled_at', fiveMinutesAgo.toISOString())
        .limit(10);

      if (error) {
        console.error("[REMINDER-MONITOR] Error finding overdue reminders:", error);
        return;
      }

      if (overdueReminders && overdueReminders.length > 0) {
        console.warn(`[REMINDER-MONITOR] Found ${overdueReminders.length} overdue reminders, triggering processing`);
        
        // Trigger reminder processing
        await supabase.functions.invoke("send-reminder-emails", {
          body: {
            debug: true,
            forceSend: true,
            source: "overdue-monitor",
            action: "process"
          }
        });
        
        // Show user notification
        toast({
          title: "Reminder System",
          description: `Processing ${overdueReminders.length} overdue reminder(s)`,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("[REMINDER-MONITOR] Error checking missed reminders:", error);
    }
  }

  /**
   * Force immediate processing of all due reminders
   */
  async forceProcessAllReminders() {
    console.log("[REMINDER-MONITOR] Force processing all due reminders");
    
    try {
      const { error } = await supabase.functions.invoke("send-reminder-emails", {
        body: {
          debug: true,
          forceSend: true,
          source: "force-process-all",
          action: "process"
        }
      });

      if (error) {
        console.error("[REMINDER-MONITOR] Error in force process:", error);
        throw error;
      }

      toast({
        title: "Reminder Processing",
        description: "Forced processing of all due reminders",
        duration: 3000,
      });
    } catch (error) {
      console.error("[REMINDER-MONITOR] Error forcing reminder processing:", error);
      toast({
        title: "Error",
        description: "Failed to force process reminders",
        variant: "destructive",
        duration: 5000,
      });
    }
  }

  /**
   * Get reminder system statistics
   */
  async getSystemStats() {
    try {
      const { data, error } = await supabase.functions.invoke("send-reminder-emails", {
        body: {
          action: "stats",
          source: "monitor-stats"
        }
      });

      if (error) {
        console.error("[REMINDER-MONITOR] Error getting stats:", error);
        return null;
      }

      return data?.stats || null;
    } catch (error) {
      console.error("[REMINDER-MONITOR] Exception getting stats:", error);
      return null;
    }
  }
}

// Export singleton instance
export const reminderMonitor = new ReminderMonitor();
