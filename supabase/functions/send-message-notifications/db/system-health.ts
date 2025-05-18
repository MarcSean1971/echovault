
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
      
    // Check trigger status (new check for trigger health)
    const { data: triggerData, error: triggerError } = await supabase
      .from('reminder_delivery_log')
      .select('count(*)', { count: 'exact' })
      .eq('delivery_channel', 'trigger')
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());
      
    const dbStatus = !testError ? 'healthy' : 'error';
    const remindersStatus = !pendingError ? 'healthy' : 'error';
    const triggerStatus = !triggerError && triggerData?.[0]?.count > 0 ? 'healthy' : 'warning';
    
    return {
      status: dbStatus === 'healthy' && remindersStatus === 'healthy' ? 'healthy' : 'degraded',
      database: dbStatus,
      reminders: remindersStatus,
      triggers: triggerStatus,
      pending_count: pendingData?.[0]?.count || 0,
      recent_activity: activityData || [],
      trigger_activity: {
        recent_hour: triggerData?.[0]?.count || 0
      },
      errors: {
        database: testError?.message,
        reminders: pendingError?.message,
        activity: activityError?.message,
        triggers: triggerError?.message
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
