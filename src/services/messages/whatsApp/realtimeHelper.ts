
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel, REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";

let realtimeChannel: RealtimeChannel | null = null;
let connectionAttempts = 0;
let isInitializing = false;
const MAX_RECONNECTION_ATTEMPTS = 3;
const RECONNECT_DELAY = 5000; // 5 seconds instead of exponential backoff

/**
 * FIXED: Enable Realtime for message_conditions table with stable connection management
 * @returns {Promise<boolean>} Success status
 */
export async function enableRealtimeForConditions(): Promise<boolean> {
  // Prevent multiple simultaneous initialization attempts
  if (isInitializing) {
    console.log('[REALTIME] Already initializing, skipping...');
    return false;
  }

  try {
    isInitializing = true;
    
    // Clean up existing channel first
    if (realtimeChannel) {
      console.log('[REALTIME] Cleaning up existing channel');
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }

    console.log('[REALTIME] Setting up stable message_conditions channel');

    // Create a channel specifically for message_conditions table
    const channel = supabase
      .channel('message_conditions_stable')
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
            console.log('[REALTIME] WhatsApp check-in detected - dispatching immediate refresh events');
            
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
                  enhanced: true
                }
              })
            );

            // Dispatch targeted update for immediate UI refresh
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
            
            console.log(`[REALTIME] Dispatched check-in events for message ${messageId}`);
          } 
          // Handle arm/disarm events (is_armed status changed)
          else if (isArmed !== oldIsArmed) {
            const action = isArmed ? 'arm' : 'disarm';
            console.log(`[REALTIME] ${action} event detected for message ${messageId}`);
            
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
            console.log('[REALTIME] General condition update');
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
          isInitializing = false;
        } else if (status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR) {
          connectionAttempts++;
          isInitializing = false;
          console.error(`[REALTIME] Channel error - attempt ${connectionAttempts}/${MAX_RECONNECTION_ATTEMPTS}`);
          
          if (connectionAttempts < MAX_RECONNECTION_ATTEMPTS) {
            console.log(`[REALTIME] Will retry connection in ${RECONNECT_DELAY}ms`);
            setTimeout(() => enableRealtimeForConditions(), RECONNECT_DELAY);
          } else {
            console.error('[REALTIME] Max reconnection attempts reached, stopping retries');
          }
        } else if (status === REALTIME_SUBSCRIBE_STATES.CLOSED) {
          isInitializing = false;
          console.warn('[REALTIME] Connection closed');
          // Only reconnect if we haven't exceeded max attempts
          if (connectionAttempts < MAX_RECONNECTION_ATTEMPTS) {
            console.log(`[REALTIME] Attempting reconnect in ${RECONNECT_DELAY}ms`);
            setTimeout(() => enableRealtimeForConditions(), RECONNECT_DELAY);
          }
        } else {
          isInitializing = false;
        }
      });
      
    realtimeChannel = channel;
    
    console.log('[REALTIME] Stable realtime connection established');
    return true;
  } catch (error) {
    console.error('[REALTIME] Failed to enable realtime:', error);
    isInitializing = false;
    connectionAttempts++;
    
    if (connectionAttempts < MAX_RECONNECTION_ATTEMPTS) {
      console.log(`[REALTIME] Retrying connection (attempt ${connectionAttempts}/${MAX_RECONNECTION_ATTEMPTS})`);
      setTimeout(() => enableRealtimeForConditions(), RECONNECT_DELAY);
    }
    
    return false;
  }
}

/**
 * Check if Realtime is properly connected
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
 * Clean up Realtime channel
 */
export function cleanupRealtimeConnection() {
  if (realtimeChannel) {
    console.log('[REALTIME] Cleaning up stable message_conditions channel');
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
    connectionAttempts = 0;
    isInitializing = false;
  }
}

/**
 * Force reconnect Realtime with better error handling
 */
export async function reconnectRealtime(): Promise<boolean> {
  console.log('[REALTIME] Force reconnecting...');
  cleanupRealtimeConnection();
  
  // Small delay before reconnecting
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return enableRealtimeForConditions();
}

/**
 * Get connection health information
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
