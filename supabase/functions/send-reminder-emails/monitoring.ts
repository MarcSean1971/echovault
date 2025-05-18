
import { supabaseClient } from "./supabase-client.ts";

/**
 * Get monitoring status with optimized queries to reduce database load
 * Updated to use the security definer function for system monitoring
 * Further optimized to use our new indexes
 */
export async function getMonitoringStatus() {
  const supabase = supabaseClient();
  
  try {
    // Use the secure system-level function for admin/edge function monitoring
    // This function uses our new indexes internally for better performance
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
 * Updated to use service role client and our new indexes
 */
async function getFallbackMonitoringStatus() {
  const supabase = supabaseClient();
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  
  // Run all queries in parallel for better performance
  const [dueResult, sentResult, failedResult] = await Promise.all([
    // Due reminders query using our new compound index
    supabase
      .from('reminder_schedule')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .lte('scheduled_at', now.toISOString()),
    
    // Sent reminders query
    supabase
      .from('reminder_schedule')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent')
      .gte('last_attempt_at', fiveMinutesAgo.toISOString()),
    
    // Failed reminders query
    supabase
      .from('reminder_schedule')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed')
      .gte('last_attempt_at', fiveMinutesAgo.toISOString())
  ]);
  
  const dueReminders = dueResult.count || 0;
  const sentReminders = sentResult.count || 0;
  const failedReminders = failedResult.count || 0;
  
  const errors = [dueResult.error, sentResult.error, failedResult.error].filter(Boolean);
  if (errors.length > 0) {
    console.error("Error in fallback monitoring queries:", errors);
  }
  
  return {
    dueReminders,
    sentLastFiveMin: sentReminders,
    failedLastFiveMin: failedReminders,
    timestamp: now.toISOString()
  };
}
