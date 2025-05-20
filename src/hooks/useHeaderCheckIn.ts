
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { performUserCheckIn } from "@/services/messages/conditions/checkInService";
import { toast } from "@/components/ui/use-toast";

/**
 * Optimized hook for check-in functionality specifically for header buttons
 */
export function useHeaderCheckIn(
  dashboardCheckIn?: () => Promise<boolean>,
  isChecking?: boolean
) {
  const navigate = useNavigate();
  const [isLocalChecking, setIsLocalChecking] = useState(false);
  const { userId } = useAuth();

  // Use the provided isChecking state or default to local state
  const checkingState = isChecking === undefined ? isLocalChecking : isChecking;

  // Modified to handle check-in directly without waiting for dashboard
  const handleCheckIn = async () => {
    if (checkingState) return false;
    
    setIsLocalChecking(true);
    
    try {
      if (!userId) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in to perform a check-in.",
          variant: "destructive"
        });
        return false;
      }
      
      // Show an immediate toast for better UX feedback
      toast({
        title: "Checking in...",
        description: "Resetting your Dead Man's Switch timers"
      });

      // Perform the actual check-in
      const success = await performUserCheckIn(userId);
      
      if (success) {
        // Dispatch an event so other components can update
        window.dispatchEvent(new CustomEvent('conditions-updated', { 
          detail: { 
            updatedAt: new Date().toISOString(),
            triggerValue: Date.now(),
            source: 'header-check-in',
            userId
          }
        }));
        
        // Show success message
        toast({
          title: "Check-In Successful",
          description: "Your Dead Man's Switch has been reset."
        });
        
        // If we have a dashboard check-in function, call it but don't wait for it
        if (dashboardCheckIn) {
          dashboardCheckIn().catch(error => {
            console.error("Background dashboard check-in error:", error);
          });
        }
        
        return true;
      } else {
        toast({
          title: "Check-In Failed",
          description: "Please try again",
          variant: "destructive"
        });
        return false;
      }
    } catch (error: any) {
      console.error("Error during check-in:", error);
      toast({
        title: "Check-In Failed",
        description: error.message || "Unable to complete check-in",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLocalChecking(false);
    }
  };

  return {
    handleCheckIn,
    isChecking: checkingState,
    navigate
  };
}
