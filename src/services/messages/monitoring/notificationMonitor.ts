import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { EmergencyRecoveryService } from "./emergencyRecovery";

/**
 * Notification monitoring service to detect and fix stuck reminders
 * UPDATED: Now uses the new emergency recovery system
 */
class NotificationMonitor {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private deadlineCheckInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  /**
   * Start monitoring for stuck reminders and deadline detection
   */
  startMonitoring() {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    console.log("[NOTIFICATION-MONITOR] Starting notification monitoring with emergency recovery");

    // Check every 30 seconds for stuck reminders - now uses emergency recovery
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkForStuckReminders();
      } catch (error) {
        console.error("[NOTIFICATION-MONITOR] Error checking stuck reminders:", error);
      }
    }, 30000);

    // Check every 10 seconds for reached deadlines
    this.deadlineCheckInterval = setInterval(async () => {
      try {
        await this.checkForReachedDeadlines();
      } catch (error) {
        console.error("[NOTIFICATION-MONITOR] Error checking deadlines:", error);
      }
    }, 10000);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    if (this.deadlineCheckInterval) {
      clearInterval(this.deadlineCheckInterval);
      this.deadlineCheckInterval = null;
    }
    this.isMonitoring = false;
    console.log("[NOTIFICATION-MONITOR] Stopped notification monitoring");
  }

  /**
   * Check for conditions that have reached their deadline
   * UPDATED: Uses emergency recovery for better reliability
   */
  private async checkForReachedDeadlines() {
    try {
      const now = new Date();
      
      // Find active conditions that should have triggered by now
      const { data: expiredConditions, error } = await supabase
        .from('message_conditions')
        .select(`
          id,
          message_id,
          condition_type,
          hours_threshold,
          minutes_threshold,
          trigger_date,
          last_checked,
          created_at
        `)
        .eq('active', true)
        .in('condition_type', ['no_check_in', 'scheduled', 'inactivity_to_date']);

      if (error) {
        console.error("[NOTIFICATION-MONITOR] Error querying expired conditions:", error);
        return;
      }

      if (!expiredConditions || expiredConditions.length === 0) {
        return;
      }

      // Check each condition to see if its deadline has passed
      for (const condition of expiredConditions) {
        let deadlineDate: Date | null = null;
        
        if (condition.condition_type === 'scheduled' && condition.trigger_date) {
          deadlineDate = new Date(condition.trigger_date);
        } else if (condition.hours_threshold) {
          const baseTime = condition.last_checked ? new Date(condition.last_checked) : new Date(condition.created_at);
          const hoursInMs = condition.hours_threshold * 60 * 60 * 1000;
          const minutesInMs = (condition.minutes_threshold || 0) * 60 * 1000;
          deadlineDate = new Date(baseTime.getTime() + hoursInMs + minutesInMs);
        }
        
        // If deadline has passed, use emergency recovery to trigger delivery
        if (deadlineDate && now >= deadlineDate) {
          console.log(`[NOTIFICATION-MONITOR] Deadline reached for condition ${condition.id}, using emergency recovery`);
          
          try {
            // Use emergency recovery service for reliable delivery
            await EmergencyRecoveryService.forceDeliverMessage(condition.message_id);
            
            // Disarm the condition
            await supabase
              .from('message_conditions')
              .update({ active: false })
              .eq('id', condition.id);
            
            // Emit events for UI updates
            window.dispatchEvent(new CustomEvent('deadline-reached', { 
              detail: { 
                deadlineTime: deadlineDate.getTime(),
                currentTime: now.getTime(),
                messageId: condition.message_id,
                conditionId: condition.id
              }
            }));
            
            window.dispatchEvent(new CustomEvent('conditions-updated', { 
              detail: { 
                messageId: condition.message_id,
                conditionId: condition.id,
                action: 'deadline-reached',
                source: 'notification-monitor-v2',
                timestamp: now.toISOString()
              }
            }));
            
          } catch (deliveryError) {
            console.error(`[NOTIFICATION-MONITOR] Error delivering message for condition ${condition.id}:`, deliveryError);
          }
        }
      }
    } catch (error) {
      console.error("[NOTIFICATION-MONITOR] Error in checkForReachedDeadlines:", error);
    }
  }

  /**
   * Check for reminders stuck in processing state
   * UPDATED: Uses emergency recovery system
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
        console.warn(`[NOTIFICATION-MONITOR] Found ${stuckReminders.length} stuck reminders, using emergency recovery`);
        
        // Use emergency recovery to fix all stuck reminders at once
        await EmergencyRecoveryService.fixStuckNotifications();
      }
    } catch (error) {
      console.error("[NOTIFICATION-MONITOR] Error in checkForStuckReminders:", error);
    }
  }

  /**
   * Force check all pending reminders right now
   * UPDATED: Uses emergency recovery
   */
  async forceCheckAllReminders() {
    console.log("[NOTIFICATION-MONITOR] Force checking all reminders using emergency recovery");
    
    try {
      await EmergencyRecoveryService.fixStuckNotifications();
    } catch (error) {
      console.error("[NOTIFICATION-MONITOR] Error in force check:", error);
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
