
import { useNavigate } from "react-router-dom";
import { useDashboardData } from "./useDashboardData";
import { useCheckIn } from "./useCheckIn";
import { useEffect, useState } from "react";

/**
 * Main hook for the dashboard trigger system
 * Combines data fetching, check-in functionality, and navigation
 */
export function useTriggerDashboard() {
  const navigate = useNavigate();
  const { handleCheckIn } = useCheckIn();
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  
  const {
    messages,
    conditions,
    setConditions,
    nextDeadline,
    setNextDeadline,
    lastCheckIn,
    setLastCheckIn,
    isLoading,
    userId,
    refreshConditions
  } = useDashboardData();

  // Handle check-in with refreshed deadline
  const handleDashboardCheckIn = async (): Promise<boolean> => {
    if (!userId) return false;
    
    console.log("Performing check-in from dashboard");
    const success = await handleCheckIn();
    
    if (success === true) {
      console.log("Check-in successful, refreshing conditions");
      // Refresh conditions data to get updated deadlines
      await refreshConditions();
      
      // Update last check-in time
      setLastCheckIn(new Date().toISOString());
      
      return true;
    }
    
    return false;
  };
  
  // Listen for condition updates via the custom event
  useEffect(() => {
    const handleConditionsUpdated = async (event: Event) => {
      if (event instanceof CustomEvent) {
        console.log("useTriggerDashboard received conditions-updated event");
        setLastRefresh(event.detail.updatedAt);
        await refreshConditions();
      }
    };
    
    window.addEventListener('conditions-updated', handleConditionsUpdated);
    return () => {
      window.removeEventListener('conditions-updated', handleConditionsUpdated);
    };
  }, [refreshConditions]);

  // Log deadline information to help with debugging
  console.log("useTriggerDashboard - current nextDeadline:", nextDeadline);

  return {
    messages,
    conditions,
    setConditions,
    nextDeadline,
    lastCheckIn,
    isLoading,
    lastRefresh,
    handleCheckIn: handleDashboardCheckIn,
    navigate,
    userId,
    refreshConditions
  };
}
