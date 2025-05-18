
import { supabaseClient } from "../supabase-client.ts";

/**
 * Get the status of the notification system
 */
export async function getSystemHealthStatus() {
  const supabase = supabaseClient();
  
  try {
    // Check database access
    const { data: testData, error: testError } = await supabase
      .from('reminder_delivery_log')
      .select('id')
      .limit(1);
      
    // Check if any reminders are pending
    const { data: pendingData, error: pendingError } = await supabase
      .from('reminder_schedule')
      .select('count(*)', { count: 'exact' })
      .eq('status', 'pending');
      
    // Get counts of recent activity
    const { data: activityData, error: activityError } = await supabase
      .from('reminder_delivery_log')
      .select('delivery_status, count(*)', { count: 'exact' })
      .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
      .group('delivery_status');
      
    const dbStatus = !testError ? 'healthy' : 'error';
    const remindersStatus = !pendingError ? 'healthy' : 'error';
    
    return {
      status: dbStatus === 'healthy' && remindersStatus === 'healthy' ? 'healthy' : 'degraded',
      database: dbStatus,
      reminders: remindersStatus,
      pending_count: pendingData?.[0]?.count || 0,
      recent_activity: activityData || [],
      errors: {
        database: testError?.message,
        reminders: pendingError?.message,
        activity: activityError?.message
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error checking system health:", error);
    return {
      status: 'error',
      errors: {
        system: error.message
      },
      timestamp: new Date().toISOString()
    };
  }
}
