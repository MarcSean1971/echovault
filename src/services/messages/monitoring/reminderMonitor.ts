
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Enhanced reminder monitoring service with automatic stuck reminder detection
 */
class ReminderMonitor {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private stuckCheckInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  /**
   * Start comprehensive monitoring with health checks
   */
  startMonitoring() {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    console.log("[REMINDER-MONITOR] Starting enhanced reminder monitoring with health checks");

    // Check every 30 seconds for stuck reminders using the new security definer function
    this.stuckCheckInterval = setInterval(async () => {
      try {
        await this.resetStuckRemindersWithSecurityDefiner();
      } catch (error) {
        console.error("[REMINDER-MONITOR] Error resetting stuck reminders:", error);
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

    // Check system health every 5 minutes
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error("[REMINDER-MONITOR] Error performing health check:", error);
      }
    }, 300000);
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
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.isMonitoring = false;
    console.log("[REMINDER-MONITOR] Stopped reminder monitoring");
  }

  /**
   * Use the new security definer function to reset stuck reminders
   */
  private async resetStuckRemindersWithSecurityDefiner() {
    try {
      const { data, error } = await supabase.rpc('reset_stuck_reminders');
      
      if (error) {
        console.error("[REMINDER-MONITOR] Error calling reset_stuck_reminders:", error);
        return;
      }
      
      const resetCount = data?.[0]?.reset_count || 0;
      if (resetCount > 0) {
        console.log(`[REMINDER-MONITOR] Successfully reset ${resetCount} stuck reminders`);
        
        toast({
          title: "Reminder System",
          description: `Reset ${resetCount} stuck reminder(s)`,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("[REMINDER-MONITOR] Exception resetting stuck reminders:", error);
    }
  }

  /**
   * Perform system health check using the new health function
   */
  private async performHealthCheck() {
    try {
      console.log("[REMINDER-MONITOR] Performing system health check...");
      
      const { data, error } = await supabase.rpc('get_reminder_system_health');
      
      if (error) {
        console.error("[REMINDER-MONITOR] Error getting system health:", error);
        return;
      }
      
      const health = data?.[0];
      if (health) {
        console.log("[REMINDER-MONITOR] System health:", health);
        
        // Alert if there are too many stuck reminders
        if (health.stuck_processing > 5) {
          toast({
            title: "Reminder System Alert",
            description: `${health.stuck_processing} reminders are stuck in processing. Attempting auto-fix.`,
            variant: "destructive",
            duration: 5000,
          });
          
          // Trigger immediate stuck reminder reset
          await this.resetStuckRemindersWithSecurityDefiner();
        }
        
        // Alert if too many failures
        if (health.failed_last_hour > 10) {
          toast({
            title: "Reminder System Warning",
            description: `${health.failed_last_hour} reminders failed in the last hour.`,
            variant: "destructive",
            duration: 5000,
          });
        }
      }
    } catch (error) {
      console.error("[REMINDER-MONITOR] Error in health check:", error);
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
        
        // Trigger reminder processing with the enhanced processor
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
   * Get reminder system statistics using the new health function
   */
  async getSystemStats() {
    try {
      const { data, error } = await supabase.rpc('get_reminder_system_health');

      if (error) {
        console.error("[REMINDER-MONITOR] Error getting health stats:", error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error("[REMINDER-MONITOR] Exception getting stats:", error);
      return null;
    }
  }

  /**
   * Manual function to reset stuck reminders
   */
  async manualResetStuckReminders() {
    try {
      console.log("[REMINDER-MONITOR] Manually resetting stuck reminders");
      
      const { data, error } = await supabase.rpc('reset_stuck_reminders');
      
      if (error) {
        console.error("[REMINDER-MONITOR] Error in manual reset:", error);
        toast({
          title: "Error",
          description: "Failed to reset stuck reminders",
          variant: "destructive",
          duration: 5000,
        });
        return;
      }
      
      const resetCount = data?.[0]?.reset_count || 0;
      
      toast({
        title: "Stuck Reminders Reset",
        description: `Successfully reset ${resetCount} stuck reminder(s)`,
        duration: 5000,
      });
      
      return resetCount;
    } catch (error) {
      console.error("[REMINDER-MONITOR] Exception in manual reset:", error);
      toast({
        title: "Error",
        description: "Failed to reset stuck reminders",
        variant: "destructive",
        duration: 5000,
      });
      return 0;
    }
  }
}

// Export singleton instance
export const reminderMonitor = new ReminderMonitor();
