
import { supabaseClient } from "./supabase-client.ts";

/**
 * Get monitoring status with optimized queries to reduce database load
 * Updated to use the security definer function for system monitoring
 */
export async function getMonitoringStatus() {
  const supabase = supabaseClient();
  
  try {
    // Use the secure system-level function for admin/edge function monitoring
    const { data, error } = await supabase
      .rpc('get_system_reminder_stats')
      .single();
    
    if (error) {
      console.error("Error getting monitoring status:", error);
      
      // Fallback - use separate queries if the function doesn't work
      return getFallbackMonitoringStatus();
    }
    
    return {
      dueReminders: data?.due_reminders || 0,
      sentLastFiveMin: data?.sent_last_5min || 0,
      failedLastFiveMin: data?.failed_last_5min || 0,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error in getMonitoringStatus:", error);
    
    // Fallback to separate queries if an error occurs
    return getFallbackMonitoringStatus();
  }
}

/**
 * Fallback monitoring status using separate queries
 * Only used if the optimized function query fails
 * Updated to use service role client
 */
async function getFallbackMonitoringStatus() {
  const supabase = supabaseClient();
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  
  // Due reminders query - OPTIMIZED: Use COUNT() instead of fetching all rows
  const { count: dueReminders, error: dueError } = await supabase
    .from('reminder_schedule')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
    .lte('scheduled_at', now.toISOString());
  
  // Sent reminders query - OPTIMIZED: Use COUNT() instead of fetching all rows
  const { count: sentReminders, error: sentError } = await supabase
    .from('reminder_schedule')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'sent')
    .gte('last_attempt_at', fiveMinutesAgo.toISOString());
  
  // Failed reminders query - OPTIMIZED: Use COUNT() instead of fetching all rows
  const { count: failedReminders, error: failedError } = await supabase
    .from('reminder_schedule')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'failed')
    .gte('last_attempt_at', fiveMinutesAgo.toISOString());
  
  if (dueError || sentError || failedError) {
    console.error("Error in fallback monitoring queries:", { dueError, sentError, failedError });
  }
  
  return {
    dueReminders: dueReminders || 0,
    sentLastFiveMin: sentReminders || 0,
    failedLastFiveMin: failedReminders || 0,
    timestamp: now.toISOString()
  };
}
