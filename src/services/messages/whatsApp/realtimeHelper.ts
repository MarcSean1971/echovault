
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Interface for Message Condition data structure
 */
interface MessageCondition {
  id: string;
  message_id: string;
  last_checked?: string;
  condition_type: string;
  active: boolean;
  [key: string]: any; // For other potential properties
}

/**
 * Payload interface for Supabase Realtime events
 */
interface RealtimePayload {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: MessageCondition;
  old: MessageCondition;
  errors: any | null;
}

/**
 * Enable Realtime functionality for WhatsApp check-ins
 * This configures a channel to listen for changes to the message_conditions table
 */
export async function enableRealtimeForConditions(): Promise<boolean> {
  try {
    console.log("[RealtimeHelper] Enabling Realtime for message_conditions table");
    
    // Create a channel for the message_conditions table
    // This is a global channel that all components can use with specific filters
    const channel = supabase.channel('message_conditions_changes')
      .on('postgres_changes', 
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'message_conditions'
        },
        (payload) => {
          // This is a global handler that logs when changes occur
          const typedPayload = payload as unknown as RealtimePayload;
          console.log('[RealtimeHelper] Detected change in message_conditions:', 
            typedPayload.eventType, 
            'for record:', 
            typedPayload.new?.id, 
            'message_id:', 
            typedPayload.new?.message_id
          );
        }
      )
      .subscribe((status) => {
        console.log(`[RealtimeHelper] Channel subscription status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          console.log('[RealtimeHelper] Successfully subscribed to message_conditions changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[RealtimeHelper] Error subscribing to message_conditions changes');
        }
      });
    
    return true;
  } catch (error) {
    console.error("[RealtimeHelper] Error enabling Realtime:", error);
    return false;
  }
}

/**
 * Check if Supabase Realtime is properly configured for the message_conditions table
 * This can be used for debugging
 */
export async function checkRealtimeStatus(): Promise<string> {
  try {
    // Create a test channel to verify connectivity
    const testChannel = supabase.channel('realtime_test');
    
    // Subscribe to the test channel
    const status = await new Promise<string>((resolve) => {
      testChannel.subscribe((status) => {
        testChannel.unsubscribe();
        resolve(status);
      });
      
      // Set a timeout in case the subscription never completes
      setTimeout(() => resolve('TIMEOUT'), 5000);
    });
    
    return status;
  } catch (error) {
    console.error("[RealtimeHelper] Error checking Realtime status:", error);
    return 'ERROR';
  }
}
