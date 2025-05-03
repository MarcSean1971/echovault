
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { performCheckIn } from "@/services/messages/conditions/checkInService";

export function useCheckIn() {
  const [isChecking, setIsChecking] = useState(false);
  
  const handleCheckIn = async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    
    try {
      const userId = localStorage.getItem("supabase.auth.token.currentSession")
        ? JSON.parse(localStorage.getItem("supabase.auth.token.currentSession") || "{}")?.user?.id
        : null;
        
      if (!userId) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in to perform a check-in.",
          variant: "destructive"
        });
        return;
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
