
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { handleArmMessage, handleDisarmMessage } from "@/services/messages/messageDetailService";
import { useConditionRefresh } from "@/hooks/useConditionRefresh";

export function useMessageCardActions() {
  const [isLoading, setIsLoading] = useState(false);
  const { refreshConditions } = useConditionRefresh();
  
  const handleArmMessage = async (conditionId: string) => {
    if (!conditionId) return null;
    
    setIsLoading(true);
    try {
      // Use the complete implementation from messageDetailService
      // which also handles reminder schedule generation
      const deadlineDate = await handleArmMessage(conditionId, (isArmed: boolean) => {
        // This is a temporary state update function that will be replaced
        // when the UI refreshes from the database
      });
      
      // Refresh conditions data to update UI components
      await refreshConditions();
      
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
      // Use the complete implementation from messageDetailService
      await handleDisarmMessage(conditionId, (isArmed: boolean) => {
        // This is a temporary state update function that will be replaced
        // when the UI refreshes from the database
      });
      
      // Refresh conditions data to update UI components
      await refreshConditions();
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
