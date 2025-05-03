
import { useNavigate } from "react-router-dom";
import { useDashboardData } from "./useDashboardData";
import { useCheckIn } from "./useCheckIn";

/**
 * Main hook for the dashboard trigger system
 * Combines data fetching, check-in functionality, and navigation
 */
export function useTriggerDashboard() {
  const navigate = useNavigate();
  const { handleCheckIn } = useCheckIn();
  
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
  const handleDashboardCheckIn = async () => {
    if (!userId) return;
    
    console.log("Performing check-in from dashboard");
    const success = await handleCheckIn();
    
    if (success) {
      console.log("Check-in successful, refreshing conditions");
      // Refresh conditions data to get updated deadlines
      const updatedConditions = await refreshConditions();
      
      // Update last check-in time
      setLastCheckIn(new Date().toISOString());
    }
  };

  // Log deadline information to help with debugging
  console.log("useTriggerDashboard - current nextDeadline:", nextDeadline);

  return {
    messages,
    conditions,
    setConditions,
    nextDeadline,
    lastCheckIn,
    isLoading,
    handleCheckIn: handleDashboardCheckIn,
    navigate,
    userId,
    refreshConditions
  };
}
