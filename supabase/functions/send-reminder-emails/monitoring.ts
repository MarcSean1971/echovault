
import { supabaseClient } from "./supabase-client.ts";

/**
 * Get monitoring stats for reminder delivery system
 */
export async function getMonitoringStatus(): Promise<{
  dueReminders: number;
  sentLastFiveMin: number;
  failedLastFiveMin: number;
  criticalPending: number;
  criticalFailed: number;
}> {
  const supabase = supabaseClient();
  
  try {
    // Count pending reminders due now
    const { count: pendingCount, error: pendingError } = await supabase
      .from('reminder_schedule')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString());
      
    if (pendingError) {
      console.error("Error counting pending reminders:", pendingError);
    }
    
    // Count reminders sent in the last 5 minutes
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count: sentCount, error: sentError } = await supabase
      .from('reminder_schedule')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent')
      .gte('last_attempt_at', fiveMinAgo);
      
    if (sentError) {
      console.error("Error counting sent reminders:", sentError);
    }
    
    // Count failed reminders in the last 5 minutes
    const { count: failedCount, error: failedError } = await supabase
      .from('reminder_schedule')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed')
      .gte('last_attempt_at', fiveMinAgo);
      
    if (failedError) {
      console.error("Error counting failed reminders:", failedError);
    }
    
    // Count critical pending reminders (final delivery that are past due)
    const { count: criticalPendingCount, error: criticalPendingError } = await supabase
      .from('reminder_schedule')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .eq('reminder_type', 'final_delivery')
      .lte('scheduled_at', new Date().toISOString());
      
    if (criticalPendingError) {
      console.error("Error counting critical pending reminders:", criticalPendingError);
    }
    
    // Count critical failed reminders (final delivery that failed)
    const { count: criticalFailedCount, error: criticalFailedError } = await supabase
      .from('reminder_schedule')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed')
      .eq('reminder_type', 'final_delivery');
      
    if (criticalFailedError) {
      console.error("Error counting critical failed reminders:", criticalFailedError);
    }
    
    // Update the status view for monitoring dashboards
    try {
      await supabase
        .from('reminder_schedule_status')
        .upsert([{
          due_reminders: pendingCount || 0,
          sent_last_5min: sentCount || 0,
          failed_last_5min: failedCount || 0,
          critical_pending: criticalPendingCount || 0,
          critical_failed: criticalFailedCount || 0,
          updated_at: new Date().toISOString()
        }], { onConflict: 'due_reminders' });
    } catch (updateError) {
      console.error("Error updating monitoring status:", updateError);
    }
    
    return {
      dueReminders: pendingCount || 0,
      sentLastFiveMin: sentCount || 0,
      failedLastFiveMin: failedCount || 0,
      criticalPending: criticalPendingCount || 0,
      criticalFailed: criticalFailedCount || 0
    };
  } catch (error) {
    console.error("Error in getMonitoringStatus:", error);
    return {
      dueReminders: 0,
      sentLastFiveMin: 0,
      failedLastFiveMin: 0,
      criticalPending: 0,
      criticalFailed: 0
    };
  }
}
