
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
    
    // Use the global message_conditions_changes channel to ensure consistency
    // with the channel created in realtimeHelper.ts
    const channel = supabase
      .channel('message_conditions_changes')
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
          if (updatedCondition && oldCondition && 
              updatedCondition.last_checked !== oldCondition.last_checked) {
            console.log('[RealtimeSync] Check-in detected, last_checked changed from:', 
              oldCondition.last_checked, 'to:', updatedCondition.last_checked);
            
            // Dispatch the conditions-updated event
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
          } else {
            console.log('[RealtimeSync] Received update but last_checked unchanged or missing data', payload);
          }
        }
      )
      .subscribe((status) => {
        console.log(`[RealtimeSync] Channel subscription status: ${status}`);
      });
    
    // Clean up subscription when component unmounts
    return () => {
      console.log(`[RealtimeSync] Cleaning up Realtime subscription for message ${messageId}`);
      supabase.removeChannel(channel);
    };
  }, [messageId]);
  
  // This component doesn't render anything
  return null;
}
