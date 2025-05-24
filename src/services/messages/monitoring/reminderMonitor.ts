
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
   * Use the security definer function to reset stuck reminders
   */
  private async resetStuckRemindersWithSecurityDefiner() {
    try {
      const { error } = await supabase.rpc('reset_stuck_reminders');
      
      if (error) {
        console.error("[REMINDER-MONITOR] Error calling reset_stuck_reminders:", error);
        return;
      }
      
      console.log("[REMINDER-MONITOR] Successfully reset stuck reminders");
    } catch (error) {
      console.error("[REMINDER-MONITOR] Exception resetting stuck reminders:", error);
    }
  }

  /**
   * Perform system health check using database query
   */
  private async performHealthCheck() {
    try {
      console.log("[REMINDER-MONITOR] Performing system health check...");
      
      // Check for overdue reminders
      const { data: overdueReminders, error: overdueError } = await supabase
        .from('reminder_schedule')
        .select('id, message_id, scheduled_at, status')
        .eq('status', 'pending')
        .lt('scheduled_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // 5 minutes overdue
        .limit(10);
      
      if (overdueError) {
        console.error("[REMINDER-MONITOR] Error checking overdue reminders:", overdueError);
        return;
      }
      
      if (overdueReminders && overdueReminders.length > 0) {
        console.warn(`[REMINDER-MONITOR] Found ${overdueReminders.length} overdue reminders`);
        
        toast({
          title: "Reminder System Alert",
          description: `${overdueReminders.length} reminders are overdue. Attempting auto-fix.`,
          variant: "destructive",
          duration: 5000,
        });
        
        // Trigger immediate processing
        await this.forceProcessAllReminders();
      }
      
      // Check for stuck processing reminders
      const { data: stuckReminders, error: stuckError } = await supabase
        .from('reminder_schedule')
        .select('id')
        .eq('status', 'processing')
        .lt('last_attempt_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // 10 minutes stuck
        .limit(5);
      
      if (!stuckError && stuckReminders && stuckReminders.length > 0) {
        console.warn(`[REMINDER-MONITOR] Found ${stuckReminders.length} stuck reminders`);
        await this.resetStuckRemindersWithSecurityDefiner();
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
   * Get reminder system statistics
   */
  async getSystemStats() {
    try {
      const { data, error } = await supabase.rpc('get_system_reminder_stats');

      if (error) {
        console.error("[REMINDER-MONITOR] Error getting system stats:", error);
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
      
      const { error } = await supabase.rpc('reset_stuck_reminders');
      
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
      
      toast({
        title: "Stuck Reminders Reset",
        description: "Successfully reset stuck reminders",
        duration: 5000,
      });
      
      return true;
    } catch (error) {
      console.error("[REMINDER-MONITOR] Exception in manual reset:", error);
      toast({
        title: "Error",
        description: "Failed to reset stuck reminders",
        variant: "destructive",
        duration: 5000,
      });
      return false;
    }
  }

  /**
   * Force process reminders for a specific message (for testing)
   */
  async forceProcessMessageReminders(messageId: string) {
    try {
      console.log(`[REMINDER-MONITOR] Force processing reminders for message ${messageId}`);
      
      const { error } = await supabase.rpc('force_process_message_reminders', {
        target_message_id: messageId
      });
      
      if (error) {
        console.error("[REMINDER-MONITOR] Error in force process message:", error);
        toast({
          title: "Error",
          description: "Failed to force process message reminders",
          variant: "destructive",
          duration: 5000,
        });
        return false;
      }
      
      // Also trigger the email processing immediately
      await supabase.functions.invoke("send-reminder-emails", {
        body: {
          messageId: messageId,
          debug: true,
          forceSend: true,
          source: "force-message-specific",
          action: "process"
        }
      });
      
      toast({
        title: "Message Reminders Forced",
        description: `Successfully forced processing for message ${messageId}`,
        duration: 5000,
      });
      
      return true;
    } catch (error) {
      console.error("[REMINDER-MONITOR] Exception in force process message:", error);
      toast({
        title: "Error",
        description: "Failed to force process message reminders",
        variant: "destructive",
        duration: 5000,
      });
      return false;
    }
  }
}

// Export singleton instance
export const reminderMonitor = new ReminderMonitor();
