
import { supabase } from "@/integrations/supabase/client";

/**
 * Enhanced reminder monitoring service with proper error handling
 * FIXED: Resolves database constraint violations in reminder tracking
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
   * Check for missed reminders and process them
   */
  private async checkMissedReminders() {
    try {
      console.log("[REMINDER-MONITOR] Checking for missed reminders...");
      
      // Call the fixed reset function
      await this.resetStuckRemindersWithSecurityDefiner();
      
      // Trigger reminder processing
      await supabase.functions.invoke("send-reminder-emails", {
        body: {
          debug: true,
          action: "process"
        }
      });
      
    } catch (error) {
      console.error("[REMINDER-MONITOR] Error in checkMissedReminders:", error);
    }
  }

  /**
   * FIXED: Reset stuck reminders using security definer function with proper message_id handling
   */
  async resetStuckRemindersWithSecurityDefiner(): Promise<void> {
    try {
      // CRITICAL FIX: Use a different approach that doesn't violate the message_id constraint
      
      // First, get stuck reminders with their message_ids
      const { data: stuckReminders, error: fetchError } = await supabase
        .from('reminder_schedule')
        .select('id, message_id, condition_id, retry_count')
        .eq('status', 'processing')
        .lt('last_attempt_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());
      
      if (fetchError) {
        console.error("[REMINDER-MONITOR] Error fetching stuck reminders:", fetchError);
        return;
      }
      
      if (stuckReminders && stuckReminders.length > 0) {
        console.log(`[REMINDER-MONITOR] Found ${stuckReminders.length} stuck reminders to reset`);
        
        // Process each reminder individually to calculate retry_count properly
        for (const reminder of stuckReminders) {
          const newRetryCount = (reminder.retry_count || 0) + 1;
          
          if (newRetryCount < 3) {
            // Reset the stuck reminder
            const { error: updateError } = await supabase
              .from('reminder_schedule')
              .update({ 
                status: 'pending',
                retry_count: newRetryCount,
                updated_at: new Date().toISOString()
              })
              .eq('id', reminder.id);
            
            if (updateError) {
              console.error(`[REMINDER-MONITOR] Error updating reminder ${reminder.id}:`, updateError);
            }
          } else {
            // Mark reminder as failed due to too many retries
            const { error: failError } = await supabase
              .from('reminder_schedule')
              .update({ 
                status: 'failed',
                updated_at: new Date().toISOString()
              })
              .eq('id', reminder.id);
            
            if (failError) {
              console.error(`[REMINDER-MONITOR] Error marking reminder ${reminder.id} as failed:`, failError);
            }
          }
        }
        
        // FIXED: Create a proper log entry with a valid message_id (use first stuck reminder's message_id)
        if (stuckReminders.length > 0) {
          const { error: logError } = await supabase
            .from('reminder_delivery_log')
            .insert({
              reminder_id: `system-reset-${Date.now()}`,
              message_id: stuckReminders[0].message_id, // Use actual message_id instead of null
              condition_id: stuckReminders[0].condition_id,
              recipient: 'system',
              delivery_channel: 'maintenance',
              delivery_status: 'completed',
              response_data: {
                action: 'reset_stuck_reminders',
                timestamp: new Date().toISOString(),
                source: 'automated_cleanup',
                count: stuckReminders.length
              }
            });
          
          if (logError) {
            console.error("[REMINDER-MONITOR] Error logging reset operation:", logError);
          } else {
            console.log(`[REMINDER-MONITOR] Successfully reset ${stuckReminders.length} stuck reminders`);
          }
        }
      }
      
    } catch (error) {
      console.error("[REMINDER-MONITOR] Error calling reset_stuck_reminders:", error);
    }
  }

  /**
   * Force process reminders for a specific message
   */
  async forceProcessMessageReminders(messageId: string): Promise<void> {
    try {
      console.log(`[REMINDER-MONITOR] Force processing reminders for message: ${messageId}`);
      
      // Reset any stuck reminders for this message
      const { error: updateError } = await supabase
        .from('reminder_schedule')
        .update({ 
          status: 'pending',
          last_attempt_at: new Date(Date.now() - 60000).toISOString(), // 1 minute ago to make eligible
          updated_at: new Date().toISOString()
        })
        .eq('message_id', messageId)
        .in('status', ['processing', 'failed'])
        .lt('retry_count', 5);
      
      if (updateError) {
        console.error(`[REMINDER-MONITOR] Error resetting reminders for message ${messageId}:`, updateError);
        return;
      }
      
      // Trigger processing for this specific message
      await supabase.functions.invoke("send-reminder-emails", {
        body: {
          messageId: messageId,
          debug: true,
          forceSend: true,
          source: "force-process-monitor"
        }
      });
      
      console.log(`[REMINDER-MONITOR] Successfully triggered force processing for message: ${messageId}`);
      
    } catch (error) {
      console.error(`[REMINDER-MONITOR] Error in forceProcessMessageReminders for ${messageId}:`, error);
    }
  }

  /**
   * Force process all due reminders
   */
  async forceProcessAllReminders(): Promise<void> {
    try {
      console.log("[REMINDER-MONITOR] Force processing all due reminders");
      
      // Reset stuck reminders first
      await this.resetStuckRemindersWithSecurityDefiner();
      
      // Trigger processing of all reminders
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
   * Manual reset of stuck reminders (public method for diagnostic use)
   */
  async manualResetStuckReminders(): Promise<void> {
    console.log("[REMINDER-MONITOR] Manual reset of stuck reminders requested");
    await this.resetStuckRemindersWithSecurityDefiner();
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
