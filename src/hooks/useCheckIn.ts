
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { performUserCheckIn } from "@/services/messages/conditions/checkInService";
import { useAuth } from "@/contexts/AuthContext";

export function useCheckIn() {
  const [isChecking, setIsChecking] = useState(false);
  const { userId } = useAuth();
  
  const handleCheckIn = async (): Promise<boolean> => {
    if (isChecking) return false;
    
    setIsChecking(true);
    console.log("[useCheckIn] Starting check-in process...");
    
    try {
      if (!userId) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in to perform a check-in.",
          variant: "destructive"
        });
        return false;
      }
      
      console.log(`[useCheckIn] Performing check-in for user: ${userId}`);
      const result = await performUserCheckIn(userId);
      console.log(`[useCheckIn] Check-in completed with result:`, result);
      
      // FIXED: Only dispatch a single event with a unique timestamp
      // Remove the redundant setTimeout-based delayed dispatch
      console.log("[useCheckIn] Dispatching single conditions-updated event");
      
      window.dispatchEvent(new CustomEvent('conditions-updated', { 
        detail: { 
          updatedAt: new Date().toISOString(),
          triggerValue: Date.now(),
          source: 'check-in-button',
          userId
        }
      }));
      
      toast({
        title: "Check-In Successful",
        description: "Your Trigger Switch has been reset."
      });
      
      return true;
    } catch (error: any) {
      console.error("[useCheckIn] Check-in failed:", error);
      toast({
        title: "Check-In Failed",
        description: error.message || "Unable to complete check-in",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  return {
    isChecking,
    handleCheckIn
  };
}
