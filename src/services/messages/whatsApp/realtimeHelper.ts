
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

let realtimeChannel: RealtimeChannel | null = null;

/**
 * ENHANCED: Enable Realtime for message_conditions table with better event handling
 * @returns {Promise<boolean>} Success status
 */
export async function enableRealtimeForConditions(): Promise<boolean> {
  try {
    // Clean up existing channel first
    if (realtimeChannel) {
      console.log('[REALTIME] Cleaning up existing channel before setup');
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }

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
          
          // Only dispatch event if last_checked timestamp changed (indicates check-in)
          if (lastChecked && oldLastChecked && lastChecked !== oldLastChecked) {
            console.log('[REALTIME] WhatsApp check-in detected, dispatching enhanced event');
            
            // Dispatch enhanced global event with check-in information
            window.dispatchEvent(
              new CustomEvent('conditions-updated', {
                detail: {
                  messageId,
                  conditionId,
                  action: 'check-in',
                  source: 'whatsapp',
                  updatedAt: lastChecked,
                  timestamp: new Date().toISOString(),
                  enhanced: true // Flag for enhanced event handling
                }
              })
            );

            // ADDED: Also dispatch a message-specific event for targeted updates
            window.dispatchEvent(
              new CustomEvent('message-targeted-update', {
                detail: {
                  messageId,
                  conditionId,
                  action: 'check-in',
                  source: 'whatsapp-realtime',
                  timestamp: new Date().toISOString()
                }
              })
            );
          } else {
            console.log('[REALTIME] General condition update (not check-in)');
            // Dispatch general update event
            window.dispatchEvent(
              new CustomEvent('conditions-updated', {
                detail: {
                  messageId,
                  conditionId,
                  action: 'update',
                  source: 'realtime',
                  timestamp: new Date().toISOString()
                }
              })
            );
          }
        })
      .subscribe((status) => {
        console.log(`[REALTIME] Subscription status: ${status}`);
        if (status === 'SUBSCRIBED') {
          console.log('[REALTIME] Successfully subscribed to message_conditions updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[REALTIME] Channel error - attempting reconnection');
          // Attempt to reconnect after a delay
          setTimeout(() => enableRealtimeForConditions(), 2000);
        }
      });
      
    realtimeChannel = channel;
    
    console.log('[REALTIME] Enhanced realtime enabled for message_conditions table');
    return true;
  } catch (error) {
    console.error('[REALTIME] Failed to enable enhanced realtime:', error);
    return false;
  }
}

/**
 * ENHANCED: Check if Realtime is properly connected and subscribed
 * @returns {Promise<string>} Status of Realtime connection
 */
export async function checkRealtimeStatus(): Promise<string> {
  try {
    if (!realtimeChannel) {
      return 'NOT_INITIALIZED';
    }
    
    const status = realtimeChannel.state;
    console.log(`[REALTIME] Current status: ${status}`);
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
    console.log('[REALTIME] Cleaning up enhanced message_conditions channel');
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
}

/**
 * ADDED: Force reconnect Realtime if needed
 */
export async function reconnectRealtime(): Promise<boolean> {
  console.log('[REALTIME] Force reconnecting...');
  cleanupRealtimeConnection();
  return enableRealtimeForConditions();
}
