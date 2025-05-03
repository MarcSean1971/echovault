
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { performCheckIn } from "@/services/messages/conditions/checkInService";
import { useAuth } from "@/contexts/AuthContext";

export function useCheckIn() {
  const [isChecking, setIsChecking] = useState(false);
  const { userId } = useAuth();
  
  const handleCheckIn = async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    
    try {
      if (!userId) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in to perform a check-in.",
          variant: "destructive"
        });
        return false;
      }
      
      await performCheckIn(userId, "app");
      
      toast({
        title: "Check-In Successful",
        description: "Your Dead Man's Switch has been reset."
      });
      
      return true;
    } catch (error: any) {
      console.error("Check-in failed:", error);
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
