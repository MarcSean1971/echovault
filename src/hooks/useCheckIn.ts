
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { performCheckIn } from "@/services/messages/conditions/checkInService";
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
      const result = await performCheckIn(userId, "app");
      console.log(`[useCheckIn] Check-in completed with result:`, result);
      
      // ENHANCED: Dispatch multiple events with slightly different timestamps 
      // to ensure all listeners catch the update
      console.log("[useCheckIn] Dispatching conditions-updated event with timestamp", Date.now());
      
      // First immediate dispatch
      window.dispatchEvent(new CustomEvent('conditions-updated', { 
        detail: { 
          updatedAt: new Date().toISOString(),
          triggerValue: Date.now(), // Add unique timestamp to ensure events are distinct
          source: 'check-in-button' // Add source information for debugging
        }
      }));
      
      // Second delayed dispatch to ensure all components have time to mount listeners
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('conditions-updated', { 
          detail: { 
            updatedAt: new Date().toISOString(),
            triggerValue: Date.now() + 1, // Different value to ensure it's treated as a new event
            source: 'check-in-button-delayed' 
          }
        }));
      }, 500);
      
      toast({
        title: "Check-In Successful",
        description: "Your Dead Man's Switch has been reset."
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
