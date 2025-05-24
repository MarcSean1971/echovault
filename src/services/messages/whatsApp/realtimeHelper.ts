import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel, REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";

let realtimeChannel: RealtimeChannel | null = null;
let connectionAttempts = 0;
const MAX_RECONNECTION_ATTEMPTS = 5;

/**
 * ENHANCED: Enable Realtime for message_conditions table with improved stability
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
      .channel('message_conditions_changes_enhanced')
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
          const isArmed = payload.new?.is_armed;
          const oldIsArmed = payload.old?.is_armed;
          
          // Handle check-in events (last_checked timestamp changed)
          if (lastChecked && oldLastChecked && lastChecked !== oldLastChecked) {
            console.log('[REALTIME] WhatsApp check-in detected, dispatching ENHANCED events');
            
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

            // Also dispatch a message-specific event for targeted updates
            window.dispatchEvent(
              new CustomEvent('message-targeted-update', {
                detail: {
                  messageId,
                  conditionId,
                  action: 'check-in',
                  source: 'whatsapp-realtime',
                  timestamp: new Date().toISOString(),
                  lastChecked: lastChecked
                }
              })
            );
          } 
          // Handle arm/disarm events (is_armed status changed)
          else if (isArmed !== oldIsArmed) {
            const action = isArmed ? 'arm' : 'disarm';
            console.log(`[REALTIME] ${action} event detected for message ${messageId}`);
            
            // Dispatch arm/disarm event
            window.dispatchEvent(
              new CustomEvent('conditions-updated', {
                detail: {
                  messageId,
                  conditionId,
                  action: action,
                  source: 'realtime',
                  timestamp: new Date().toISOString(),
                  isArmed: isArmed
                }
              })
            );
          } 
          // Handle other general updates
          else {
            console.log('[REALTIME] General condition update (not check-in or arm/disarm)');
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
        
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          console.log('[REALTIME] Successfully subscribed to message_conditions updates');
          connectionAttempts = 0; // Reset attempts on successful connection
        } else if (status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR) {
          connectionAttempts++;
          console.error(`[REALTIME] Channel error - attempt ${connectionAttempts}/${MAX_RECONNECTION_ATTEMPTS}`);
          
          if (connectionAttempts < MAX_RECONNECTION_ATTEMPTS) {
            // Exponential backoff for reconnection
            const delay = Math.min(1000 * Math.pow(2, connectionAttempts), 30000);
            console.log(`[REALTIME] Attempting reconnection in ${delay}ms`);
            setTimeout(() => enableRealtimeForConditions(), delay);
          } else {
            console.error('[REALTIME] Max reconnection attempts reached, giving up');
          }
        } else if (status === REALTIME_SUBSCRIBE_STATES.CLOSED) {
          console.warn('[REALTIME] Connection closed, attempting reconnect');
          setTimeout(() => enableRealtimeForConditions(), 2000);
        }
      });
      
    realtimeChannel = channel;
    
    console.log('[REALTIME] Enhanced realtime enabled for message_conditions table');
    return true;
  } catch (error) {
    console.error('[REALTIME] Failed to enable enhanced realtime:', error);
    connectionAttempts++;
    
    if (connectionAttempts < MAX_RECONNECTION_ATTEMPTS) {
      console.log(`[REALTIME] Retrying connection (attempt ${connectionAttempts}/${MAX_RECONNECTION_ATTEMPTS})`);
      setTimeout(() => enableRealtimeForConditions(), 5000);
    }
    
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
    console.log(`[REALTIME] Current status check: ${status}`);
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
    connectionAttempts = 0;
  }
}

/**
 * ENHANCED: Force reconnect Realtime with better error handling
 */
export async function reconnectRealtime(): Promise<boolean> {
  console.log('[REALTIME] Force reconnecting with enhanced stability...');
  cleanupRealtimeConnection();
  
  // Small delay before reconnecting
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return enableRealtimeForConditions();
}

/**
 * ADDED: Get connection health information
 */
export function getConnectionHealth(): { 
  isConnected: boolean; 
  attempts: number; 
  maxAttempts: number;
  status: string;
} {
  return {
    isConnected: realtimeChannel?.state === 'joined',
    attempts: connectionAttempts,
    maxAttempts: MAX_RECONNECTION_ATTEMPTS,
    status: realtimeChannel?.state || 'NOT_INITIALIZED'
  };
}
