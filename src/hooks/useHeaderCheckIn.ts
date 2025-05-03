
import { useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Hook for check-in functionality specifically for header buttons
 */
export function useHeaderCheckIn(
  handleDashboardCheckIn: () => Promise<boolean>,
  isChecking: boolean
) {
  const navigate = useNavigate();
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0);

  // Modified check-in handler that also dispatches the event
  const handleCheckIn = async () => {
    try {
      // Explicitly ensure we get a boolean result from handleDashboardCheckIn
      const success = await handleDashboardCheckIn();
      
      // Only proceed if success is explicitly true
      if (success === true) {
        // Increment local trigger for immediate UI update
        setLocalRefreshTrigger(prev => prev + 1);
        
        // Dispatch event with current timestamp for global updates
        console.log("Dispatching conditions-updated event from HeaderButtons");
        window.dispatchEvent(new CustomEvent('conditions-updated', { 
          detail: { 
            updatedAt: new Date().toISOString(),
            triggerValue: Date.now() // Add unique value to ensure it's always different
          }
        }));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error during check-in:", error);
      return false;
    }
  };

  return {
    handleCheckIn,
    localRefreshTrigger
  };
}
