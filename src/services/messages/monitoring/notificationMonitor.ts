
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Notification monitoring service to detect and fix stuck reminders
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
    console.log("[NOTIFICATION-MONITOR] Starting notification monitoring");

    // Check every 30 seconds for stuck reminders
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
        
        // If deadline has passed, trigger automatic delivery
        if (deadlineDate && now >= deadlineDate) {
          console.log(`[NOTIFICATION-MONITOR] Deadline reached for condition ${condition.id}, triggering delivery`);
          
          try {
            // Disarm the condition first
            await supabase
              .from('message_conditions')
              .update({ active: false })
              .eq('id', condition.id);
            
            // Trigger the message delivery
            await this.triggerMessageDelivery(condition.message_id, condition.id);
            
            // Emit a deadline-reached event for UI updates
            window.dispatchEvent(new CustomEvent('deadline-reached', { 
              detail: { 
                deadlineTime: deadlineDate.getTime(),
                currentTime: now.getTime(),
                messageId: condition.message_id,
                conditionId: condition.id
              }
            }));
            
            // Emit conditions-updated event for UI refresh
            window.dispatchEvent(new CustomEvent('conditions-updated', { 
              detail: { 
                messageId: condition.message_id,
                conditionId: condition.id,
                action: 'deadline-reached',
                source: 'notification-monitor',
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
   * Trigger message delivery for a specific condition
   */
  private async triggerMessageDelivery(messageId: string, conditionId: string) {
    try {
      console.log(`[NOTIFICATION-MONITOR] Triggering delivery for message ${messageId}`);
      
      const { error } = await supabase.functions.invoke("send-message-notifications", {
        body: {
          messageId: messageId,
          debug: true,
          forceSend: true,
          source: "deadline-reached",
          conditionId: conditionId
        }
      });

      if (error) {
        console.error(`[NOTIFICATION-MONITOR] Error triggering message delivery:`, error);
        throw error;
      }
      
      console.log(`[NOTIFICATION-MONITOR] Successfully triggered delivery for message ${messageId}`);
    } catch (error) {
      console.error(`[NOTIFICATION-MONITOR] Error in triggerMessageDelivery:`, error);
      throw error;
    }
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
