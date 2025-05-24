
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Notification monitoring service to detect and fix stuck reminders
 */
class NotificationMonitor {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  /**
   * Start monitoring for stuck reminders
   */
  startMonitoring() {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    console.log("[NOTIFICATION-MONITOR] Starting notification monitoring");

    // Check every 30 seconds for stuck reminders
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkForStuckReminders();
      } catch (error) {
        console.error("[NOTIFICATION-MONITOR] Error checking stuck reminders:", error);
      }
    }, 30000);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log("[NOTIFICATION-MONITOR] Stopped notification monitoring");
  }

  /**
   * Check for reminders stuck in processing state
   */
  private async checkForStuckReminders() {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      // Find reminders that have been in "processing" state for more than 5 minutes
      const { data: stuckReminders, error } = await supabase
        .from('reminder_schedule')
        .select('*')
        .eq('status', 'processing')
        .lt('last_attempt_at', fiveMinutesAgo.toISOString());

      if (error) {
        console.error("[NOTIFICATION-MONITOR] Error querying stuck reminders:", error);
        return;
      }

      if (stuckReminders && stuckReminders.length > 0) {
        console.warn(`[NOTIFICATION-MONITOR] Found ${stuckReminders.length} stuck reminders`);
        
        // Reset stuck reminders to pending status
        const { error: resetError } = await supabase
          .from('reminder_schedule')
          .update({
            status: 'pending',
            retry_count: 0,
            updated_at: new Date().toISOString()
          })
          .in('id', stuckReminders.map(r => r.id));

        if (resetError) {
          console.error("[NOTIFICATION-MONITOR] Error resetting stuck reminders:", resetError);
          return;
        }

        console.log(`[NOTIFICATION-MONITOR] Reset ${stuckReminders.length} stuck reminders to pending`);

        // Trigger immediate processing for each affected message
        for (const reminder of stuckReminders) {
          try {
            await this.triggerImmediateProcessing(reminder.message_id);
          } catch (triggerError) {
            console.error(`[NOTIFICATION-MONITOR] Error triggering processing for message ${reminder.message_id}:`, triggerError);
          }
        }

        // Show user notification about recovery
        toast({
          title: "System Recovery",
          description: `Recovered ${stuckReminders.length} stuck notification(s)`,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("[NOTIFICATION-MONITOR] Error in checkForStuckReminders:", error);
    }
  }

  /**
   * Trigger immediate processing for a specific message
   */
  private async triggerImmediateProcessing(messageId: string) {
    try {
      console.log(`[NOTIFICATION-MONITOR] Triggering immediate processing for message ${messageId}`);
      
      const { error } = await supabase.functions.invoke("send-reminder-emails", {
        body: {
          messageId: messageId,
          debug: true,
          forceSend: true,
          source: "notification-monitor-recovery",
          bypassDeduplication: true
        }
      });

      if (error) {
        console.error(`[NOTIFICATION-MONITOR] Error triggering immediate processing:`, error);
        
        // Try backup method
        await supabase.functions.invoke("send-message-notifications", {
          body: {
            messageId: messageId,
            debug: true,
            forceSend: true,
            source: "notification-monitor-backup",
            bypassDeduplication: true
          }
        });
      }
    } catch (error) {
      console.error(`[NOTIFICATION-MONITOR] Error in triggerImmediateProcessing:`, error);
    }
  }

  /**
   * Force check all pending reminders right now
   */
  async forceCheckAllReminders() {
    console.log("[NOTIFICATION-MONITOR] Force checking all pending reminders");
    
    try {
      const { error } = await supabase.functions.invoke("send-reminder-emails", {
        body: {
          debug: true,
          forceSend: true,
          source: "force-check-all",
          action: "process"
        }
      });

      if (error) {
        console.error("[NOTIFICATION-MONITOR] Error in force check:", error);
        throw error;
      }

      toast({
        title: "Reminder Check Triggered",
        description: "Forced processing of all pending reminders",
        duration: 3000,
      });
    } catch (error) {
      console.error("[NOTIFICATION-MONITOR] Error forcing reminder check:", error);
      toast({
        title: "Error",
        description: "Failed to trigger reminder check",
        variant: "destructive",
        duration: 5000,
      });
    }
  }
}

// Export singleton instance
export const notificationMonitor = new NotificationMonitor();
