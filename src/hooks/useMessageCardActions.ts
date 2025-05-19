
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useConditionRefresh } from "@/hooks/useConditionRefresh";

/**
 * Hook for handling message card arming/disarming actions
 * Optimized for performance when used from card views
 */
export function useMessageCardActions() {
  const [isLoading, setIsLoading] = useState(false);
  const { refreshConditions } = useConditionRefresh();
  
  // Fast arming implementation that avoids unnecessary content loading
  const handleArmMessage = async (conditionId: string) => {
    if (!conditionId) {
      console.log("[useMessageCardActions] Cannot arm message: no conditionId provided");
      return null;
    }
    
    setIsLoading(true);
    console.log(`[useMessageCardActions] Fast arming message with condition ${conditionId}`);
    
    try {
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
      
      // Get deadline for UI feedback
      const messageId = data.message_id;
      
      // Fire a background event to handle reminder generation without blocking UI
      setTimeout(() => {
        const event = new CustomEvent('generate-message-reminders', { 
          detail: { messageId, conditionId }
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
