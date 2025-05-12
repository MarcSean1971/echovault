
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { armMessage, disarmMessage } from "@/services/messages/conditionService";
import { useConditionRefresh } from "@/hooks/useConditionRefresh";

export function useMessageCardActions() {
  const [isLoading, setIsLoading] = useState(false);
  const { refreshConditions } = useConditionRefresh();
  
  const handleArmMessage = async (conditionId: string) => {
    if (!conditionId) return;
    
    setIsLoading(true);
    try {
      await armMessage(conditionId);
      
      // Get updated deadline
      const deadlineDate = await refreshConditions();
      
      toast({
        title: "Message armed",
        description: "Your message has been armed and will trigger according to your settings",
      });
      
      return deadlineDate;
    } catch (error) {
      console.error("Error arming message:", error);
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
    if (!conditionId) return;
    
    setIsLoading(true);
    try {
      await disarmMessage(conditionId);
      
      // Refresh condition data in other components
      await refreshConditions();
      
      toast({
        title: "Message disarmed",
        description: "Your message has been disarmed and will not trigger",
      });
    } catch (error) {
      console.error("Error disarming message:", error);
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
