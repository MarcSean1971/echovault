
import { supabaseClient } from "./supabase-client.ts";

/**
 * Service to clean up failed and stuck reminders
 */
export async function cleanupFailedReminders(debug: boolean = false): Promise<{ cleaned: number; errors: string[] }> {
  const supabase = supabaseClient();
  const errors: string[] = [];
  let cleanedCount = 0;
  
  try {
    console.log("[CLEANUP-SERVICE] Starting cleanup of failed reminders...");
    
    // CRITICAL FIX: Find and reset reminders that failed due to past scheduling bug
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: recentFailedReminders, error: findRecentError } = await supabase
      .from('reminder_schedule')
      .select('id, message_id, scheduled_at, status, created_at')
      .eq('status', 'failed')
      .gt('created_at', oneHourAgo); // Only recent failures
    
    if (findRecentError) {
      errors.push(`Error finding recent failed reminders: ${findRecentError.message}`);
    } else if (recentFailedReminders && recentFailedReminders.length > 0) {
      console.log(`[CLEANUP-SERVICE] Found ${recentFailedReminders.length} recent failed reminders to investigate`);
      
      // Check which of these failed because they were scheduled in the past
      const now = new Date();
      const invalidReminders = recentFailedReminders.filter(r => {
        const scheduledAt = new Date(r.scheduled_at);
        const createdAt = new Date(r.created_at);
        // If scheduled time was in the past when created, it was likely our bug
        return scheduledAt <= createdAt;
      });
      
      if (invalidReminders.length > 0) {
        console.log(`[CLEANUP-SERVICE] Found ${invalidReminders.length} reminders that failed due to past scheduling`);
        
        // Delete these invalid reminders - they need to be recreated properly
        const { error: deleteError } = await supabase
          .from('reminder_schedule')
          .delete()
          .in('id', invalidReminders.map(r => r.id));
        
        if (deleteError) {
          errors.push(`Error deleting invalid reminders: ${deleteError.message}`);
        } else {
          cleanedCount += invalidReminders.length;
          console.log(`[CLEANUP-SERVICE] Deleted ${invalidReminders.length} invalid reminders`);
        }
      }
    }
    
    // Find reminders that have been stuck in 'processing' for more than 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    const { data: stuckReminders, error: findError } = await supabase
      .from('reminder_schedule')
      .select('id, message_id, last_attempt_at, status')
      .eq('status', 'processing')
      .lt('last_attempt_at', tenMinutesAgo);
    
    if (findError) {
      errors.push(`Error finding stuck reminders: ${findError.message}`);
    } else if (stuckReminders && stuckReminders.length > 0) {
      console.log(`[CLEANUP-SERVICE] Found ${stuckReminders.length} stuck reminders to reset`);
      
      // Reset these to pending so they can be processed again
      const { error: resetError } = await supabase
        .from('reminder_schedule')
        .update({
          status: 'pending',
          last_attempt_at: null,
          updated_at: new Date().toISOString()
        })
        .in('id', stuckReminders.map(r => r.id));
      
      if (resetError) {
        errors.push(`Error resetting stuck reminders: ${resetError.message}`);
      } else {
        cleanedCount += stuckReminders.length;
        console.log(`[CLEANUP-SERVICE] Reset ${stuckReminders.length} stuck reminders to pending`);
      }
    }
    
    // Find reminders that have failed multiple times and are old
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: oldFailedReminders, error: findOldError } = await supabase
      .from('reminder_schedule')
      .select('id, message_id, created_at')
      .eq('status', 'failed')
      .lt('created_at', oneDayAgo);
    
    if (findOldError) {
      errors.push(`Error finding old failed reminders: ${findOldError.message}`);
    } else if (oldFailedReminders && oldFailedReminders.length > 0) {
      console.log(`[CLEANUP-SERVICE] Found ${oldFailedReminders.length} old failed reminders to remove`);
      
      // Delete old failed reminders to clean up the table
      const { error: deleteError } = await supabase
        .from('reminder_schedule')
        .delete()
        .in('id', oldFailedReminders.map(r => r.id));
      
      if (deleteError) {
        errors.push(`Error deleting old failed reminders: ${deleteError.message}`);
      } else {
        console.log(`[CLEANUP-SERVICE] Deleted ${oldFailedReminders.length} old failed reminders`);
      }
    }
    
    console.log(`[CLEANUP-SERVICE] Cleanup complete. Processed: ${cleanedCount}, Errors: ${errors.length}`);
    
    return { cleaned: cleanedCount, errors };
    
  } catch (error: any) {
    console.error("[CLEANUP-SERVICE] Error in cleanupFailedReminders:", error);
    errors.push(`Cleanup exception: ${error.message}`);
    return { cleaned: cleanedCount, errors };
  }
}

/**
 * Force reset all stuck reminders to pending status
 */
export async function forceResetAllStuckReminders(): Promise<{ reset: number; error?: string }> {
  const supabase = supabaseClient();
  
  try {
    console.log("[CLEANUP-SERVICE] Force resetting ALL stuck reminders...");
    
    const { data: stuckReminders, error: findError } = await supabase
      .from('reminder_schedule')
      .select('id')
      .eq('status', 'processing');
    
    if (findError) {
      throw findError;
    }
    
    if (!stuckReminders || stuckReminders.length === 0) {
      console.log("[CLEANUP-SERVICE] No stuck reminders found to reset");
      return { reset: 0 };
    }
    
    const { error: resetError } = await supabase
      .from('reminder_schedule')
      .update({
        status: 'pending',
        last_attempt_at: null,
        updated_at: new Date().toISOString()
      })
      .in('id', stuckReminders.map(r => r.id));
    
    if (resetError) {
      throw resetError;
    }
    
    console.log(`[CLEANUP-SERVICE] Force reset ${stuckReminders.length} stuck reminders`);
    return { reset: stuckReminders.length };
    
  } catch (error: any) {
    console.error("[CLEANUP-SERVICE] Error in forceResetAllStuckReminders:", error);
    return { reset: 0, error: error.message };
  }
}
