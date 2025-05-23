
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";

/**
 * Component that listens for Supabase Realtime updates to message conditions
 * and dispatches appropriate events to update the UI
 */
export function RealtimeConditionSync() {
  const { id: messageId } = useParams<{ id: string }>();
  
  // Set up Supabase Realtime subscription when component mounts
  useEffect(() => {
    if (!messageId) return;
    
    console.log(`[RealtimeSync] Setting up Realtime subscription for message ${messageId}`);
    
    // Create a channel to listen for changes to the message_conditions table
    // specifically for the current message
    const channel = supabase
      .channel(`message_conditions_${messageId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'message_conditions',
          filter: `message_id=eq.${messageId}`
        },
        (payload) => {
          // When a message condition is updated (e.g., via WhatsApp check-in)
          console.log('[RealtimeSync] Received condition update:', payload);
          
          // Extract the updated data
          const updatedCondition = payload.new;
          const oldCondition = payload.old;
          
          // Check if the last_checked timestamp changed (indicating a check-in)
          if (updatedCondition.last_checked !== oldCondition.last_checked) {
            console.log('[RealtimeSync] Check-in detected, dispatching conditions-updated event');
            
            // Dispatch the same event that's used for browser check-ins
            window.dispatchEvent(
              new CustomEvent('conditions-updated', {
                detail: {
                  messageId: messageId,
                  conditionId: updatedCondition.id,
                  action: 'check-in',
                  source: 'whatsapp',
                  updatedAt: updatedCondition.last_checked,
                  timestamp: new Date().toISOString()
                }
              })
            );
          }
        }
      )
      .subscribe();
    
    // Clean up subscription when component unmounts
    return () => {
      console.log(`[RealtimeSync] Cleaning up Realtime subscription for message ${messageId}`);
      supabase.removeChannel(channel);
    };
  }, [messageId]);
  
  // This component doesn't render anything
  return null;
}
