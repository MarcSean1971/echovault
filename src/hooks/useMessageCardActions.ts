
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useConditionRefresh } from "@/hooks/useConditionRefresh";
import { invalidateConditionCache } from "@/hooks/useMessageCondition";

/**
 * Hook for handling message card arming/disarming actions
 * Optimized for performance when used from card views
 */
export function useMessageCardActions() {
  const [isLoading, setIsLoading] = useState(false);
  const { refreshConditions } = useConditionRefresh();
  
  // Fast arming implementation with optimistic UI updates
  const handleArmMessage = async (conditionId: string) => {
    if (!conditionId) {
      console.log("[useMessageCardActions] Cannot arm message: no conditionId provided");
      return null;
    }
    
    setIsLoading(true);
    console.log(`[useMessageCardActions] Fast arming message with condition ${conditionId}`);
    
    try {
      // First, get the current condition to extract messageId for later use
      const { data: currentCondition, error: fetchError } = await supabase
        .from("message_conditions")
        .select("message_id")
        .eq("id", conditionId)
        .single();
        
      if (fetchError) throw fetchError;
      
      const messageId = currentCondition?.message_id;
      
      // Immediately invalidate cache to force a refresh on next query
      if (messageId) {
        invalidateConditionCache(messageId);
      }
      
      // Emit an optimistic update event immediately
      window.dispatchEvent(new CustomEvent('conditions-updated', { 
        detail: { 
          conditionId,
          messageId,
          action: 'arm',
          optimistic: true,
          timestamp: new Date().toISOString()
        }
      }));
      
      // Direct database operation for faster arming - avoids processing content
      const { data, error } = await supabase
        .from("message_conditions")
        .update({ 
          active: true,
          last_checked: new Date().toISOString() 
        })
        .eq("id", conditionId)
        .select("id, message_id")
        .single();
      
      if (error) {
        throw error;
      }
      
      // Get message ID for UI feedback and reminders
      const actualMessageId = data.message_id;
      
      // Fire a background event to handle reminder generation without blocking UI
      setTimeout(() => {
        const event = new CustomEvent('generate-message-reminders', { 
          detail: { messageId: actualMessageId, conditionId }
        });
        window.dispatchEvent(event);
      }, 100);
      
      // Get deadline for immediate UI feedback
      const { data: condition } = await supabase
        .from("message_conditions")
        .select("*")
        .eq("id", conditionId)
        .single();
        
      // Calculate deadline
      let deadlineDate: Date | null = null;
      if (condition) {
        if (condition.condition_type === "scheduled" && condition.trigger_date) {
          deadlineDate = new Date(condition.trigger_date);
        } else if (condition.hours_threshold) {
          const hoursInMs = condition.hours_threshold * 60 * 60 * 1000;
          const minutesInMs = (condition.minutes_threshold || 0) * 60 * 1000;
          deadlineDate = new Date(Date.now() + hoursInMs + minutesInMs);
        }
      }
      
      console.log(`[useMessageCardActions] Fast arm successful, deadline: ${deadlineDate?.toISOString() || 'unknown'}`);
      
      // Show success toast
      toast({
        title: "Message armed",
        description: "Your message has been armed and will trigger according to your settings"
      });
      
      // Fire a confirmed update event now that we have real data
      window.dispatchEvent(new CustomEvent('conditions-updated', { 
        detail: { 
          conditionId,
          messageId: actualMessageId,
          action: 'arm',
          optimistic: false,
          deadline: deadlineDate?.toISOString(),
          timestamp: new Date().toISOString()
        }
      }));
      
      // Refresh conditions data to update UI components with the latest state
      await refreshConditions();
      
      return deadlineDate;
    } catch (error) {
      console.error("[useMessageCardActions] Error arming message:", error);
      toast({
        title: "Failed to arm message",
        description: "There was a problem arming your message",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDisarmMessage = async (conditionId: string) => {
    if (!conditionId) {
      console.log("[useMessageCardActions] Cannot disarm message: no conditionId provided");
      return;
    }
    
    setIsLoading(true);
    console.log(`[useMessageCardActions] Disarming message with condition ${conditionId}`);
    
    try {
      // First, get the current condition to extract messageId for later use
      const { data: currentCondition, error: fetchError } = await supabase
        .from("message_conditions")
        .select("message_id")
        .eq("id", conditionId)
        .single();
        
      if (fetchError) throw fetchError;
      
      const messageId = currentCondition?.message_id;
      
      // Immediately invalidate cache to force a refresh on next query
      if (messageId) {
        invalidateConditionCache(messageId);
      }
      
      // Emit an optimistic update event immediately
      window.dispatchEvent(new CustomEvent('conditions-updated', { 
        detail: { 
          conditionId,
          messageId,
          action: 'disarm',
          optimistic: true,
          timestamp: new Date().toISOString()
        }
      }));
      
      // Direct database operation for faster disarming
      const { error } = await supabase
        .from("message_conditions")
        .update({ active: false })
        .eq("id", conditionId);
      
      if (error) {
        throw error;
      }
      
      console.log("[useMessageCardActions] Message disarmed successfully");
      
      // Show success toast
      toast({
        title: "Message disarmed",
        description: "Your message has been disarmed and will not trigger"
      });
      
      // Fire a confirmed update event now that we have real data
      window.dispatchEvent(new CustomEvent('conditions-updated', { 
        detail: { 
          conditionId,
          messageId,
          action: 'disarm',
          optimistic: false,
          timestamp: new Date().toISOString() 
        }
      }));
      
      // Refresh conditions data to update UI components with the latest state
      await refreshConditions();
    } catch (error) {
      console.error("[useMessageCardActions] Error disarming message:", error);
      toast({
        title: "Failed to disarm message",
        description: "There was a problem disarming your message",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    isLoading,
    handleArmMessage,
    handleDisarmMessage
  };
}
