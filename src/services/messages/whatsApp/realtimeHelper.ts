
import { supabase } from "@/integrations/supabase/client";

/**
 * Enable Realtime functionality for WhatsApp check-ins
 * This configures a channel to listen for changes to the message_conditions table
 */
export async function enableRealtimeForConditions(): Promise<boolean> {
  try {
    console.log("[RealtimeHelper] Enabling Realtime for message_conditions table");
    
    // Create a channel for the message_conditions table
    // The channel subscribes to all changes on message_conditions
    // The actual filtering happens in each component that uses the channel
    const channel = supabase.channel('message_conditions_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'message_conditions'
        },
        (payload) => {
          // This is a global handler that logs but doesn't dispatch events
          // Each component will have its own specific handler
          console.log('[RealtimeHelper] Detected change in message_conditions:', payload);
        }
      )
      .subscribe();
    
    if (channel) {
      console.log("[RealtimeHelper] Realtime subscription created successfully for message_conditions table");
      return true;
    } else {
      console.error("[RealtimeHelper] Failed to create Realtime subscription");
      return false;
    }
  } catch (error) {
    console.error("[RealtimeHelper] Error enabling Realtime:", error);
    return false;
  }
}
