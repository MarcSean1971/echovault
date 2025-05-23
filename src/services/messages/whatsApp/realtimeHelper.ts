
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

let realtimeChannel: RealtimeChannel | null = null;

/**
 * Enable Realtime for message_conditions table to get condition updates
 * @returns {Promise<boolean>} Success status
 */
export async function enableRealtimeForConditions(): Promise<boolean> {
  try {
    // Create a channel specifically for message_conditions table
    const channel = supabase
      .channel('message_conditions_changes')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'message_conditions'
        },
        (payload) => {
          console.log('[REALTIME] Received message_conditions update:', payload);
          
          // Extract message_id from the updated condition
          const messageId = payload.new?.message_id;
          const conditionId = payload.new?.id;
          const lastChecked = payload.new?.last_checked;
          const oldLastChecked = payload.old?.last_checked;
          
          // Only dispatch event if last_checked timestamp changed
          if (lastChecked && oldLastChecked && lastChecked !== oldLastChecked) {
            console.log('[REALTIME] Check-in detected, dispatching conditions-updated event');
            
            // Dispatch global event with check-in information
            window.dispatchEvent(
              new CustomEvent('conditions-updated', {
                detail: {
                  messageId,
                  conditionId,
                  action: 'check-in',
                  source: 'realtime',
                  updatedAt: lastChecked,
                  timestamp: new Date().toISOString()
                }
              })
            );
          }
        })
      .subscribe();
      
    realtimeChannel = channel;
    
    console.log('[REALTIME] Enabled for message_conditions table');
    return true;
  } catch (error) {
    console.error('[REALTIME] Failed to enable for message_conditions:', error);
    return false;
  }
}

/**
 * Check if Realtime is properly connected and subscribed
 * @returns {Promise<string>} Status of Realtime connection
 */
export async function checkRealtimeStatus(): Promise<string> {
  try {
    if (!realtimeChannel) {
      return 'NOT_INITIALIZED';
    }
    
    const status = realtimeChannel.state;
    return status || 'UNKNOWN';
  } catch (error) {
    console.error('[REALTIME] Error checking status:', error);
    return 'ERROR';
  }
}

/**
 * Clean up Realtime channel on application exit
 */
export function cleanupRealtimeConnection() {
  if (realtimeChannel) {
    console.log('[REALTIME] Cleaning up message_conditions channel');
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
}
