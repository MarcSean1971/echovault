
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

  // Modified to NOT dispatch another event, since the original check-in already dispatches one
  const handleCheckIn = async () => {
    try {
      // Use the dashboard check-in function which already dispatches the event
      const success = await handleDashboardCheckIn();
      
      // Only update local state if successful
      if (success === true) {
        // Increment local trigger for immediate UI update
        setLocalRefreshTrigger(prev => prev + 1);
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
