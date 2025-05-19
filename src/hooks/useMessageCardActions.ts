
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { handleArmMessage as serviceArmMessage, handleDisarmMessage as serviceDisarmMessage } from "@/services/messages/messageDetailService";
import { useConditionRefresh } from "@/hooks/useConditionRefresh";

/**
 * Hook for handling message card arming/disarming actions
 * This implementation ensures consistent behavior with the detail page
 */
export function useMessageCardActions() {
  const [isLoading, setIsLoading] = useState(false);
  const { refreshConditions } = useConditionRefresh();
  
  const handleArmMessage = async (conditionId: string) => {
    if (!conditionId) {
      console.log("[useMessageCardActions] Cannot arm message: no conditionId provided");
      return null;
    }
    
    setIsLoading(true);
    console.log(`[useMessageCardActions] Arming message with condition ${conditionId}`);
    
    try {
      // Pass the condition ID and a proper setIsArmed callback to ensure reminder generation
      const deadlineDate = await serviceArmMessage(conditionId, (isArmed: boolean) => {
        console.log(`[useMessageCardActions] Setting armed status to ${isArmed} in callback`);
      });
      
      console.log(`[useMessageCardActions] Message armed successfully, deadline: ${deadlineDate}`);
      
      // Refresh conditions data to update UI components with the latest state
      await refreshConditions();
      console.log("[useMessageCardActions] Conditions refreshed after arming");
      
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
      // Pass the condition ID and a proper setIsArmed callback
      await serviceDisarmMessage(conditionId, (isArmed: boolean) => {
        console.log(`[useMessageCardActions] Setting armed status to ${isArmed} in callback`);
      });
      
      console.log("[useMessageCardActions] Message disarmed successfully");
      
      // Refresh conditions data to update UI components with the latest state
      await refreshConditions();
      console.log("[useMessageCardActions] Conditions refreshed after disarming");
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
