
import { useNavigate } from "react-router-dom";
import { useDashboardData } from "./useDashboardData";
import { useCheckIn } from "./useCheckIn";
import { useEffect, useState, useCallback } from "react";

/**
 * Main hook for the dashboard trigger system
 * Combines data fetching, check-in functionality, and navigation
 * Fixed to avoid circular dependencies and handle errors properly
 */
export function useTriggerDashboard() {
  const navigate = useNavigate();
  const { handleCheckIn } = useCheckIn();
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  
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
    refreshConditions: refreshDashboardConditions
  } = useDashboardData();

  // Create a wrapper for refreshConditions that doesn't need arguments
  const refreshConditions = useCallback(() => {
    return refreshDashboardConditions();
  }, [refreshDashboardConditions]);

  // Handle check-in with refreshed deadline
  const handleDashboardCheckIn = async (): Promise<boolean> => {
    if (!userId) return false;
    
    console.log("Performing check-in from dashboard");
    try {
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
    } catch (error) {
      console.error("Error during check-in:", error);
      setLoadError("Failed to perform check-in. Please try again.");
      return false;
    }
  };
  
  // Listen for condition updates via the custom event
  useEffect(() => {
    const handleConditionsUpdated = async (event: Event) => {
      if (event instanceof CustomEvent) {
        console.log("useTriggerDashboard received conditions-updated event");
        setLastRefresh(event.detail.updatedAt || new Date().toISOString());
        try {
          await refreshConditions();
        } catch (error) {
          console.error("Error refreshing after conditions-updated event:", error);
        }
      }
    };
    
    window.addEventListener('conditions-updated', handleConditionsUpdated);
    return () => {
      window.removeEventListener('conditions-updated', handleConditionsUpdated);
    };
  }, [refreshConditions]);

  // Store userId in localStorage for component recovery
  useEffect(() => {
    if (userId) {
      localStorage.setItem('lastUserId', userId);
    }
  }, [userId]);

  // Log deadline information to help with debugging
  console.log("useTriggerDashboard - current nextDeadline:", nextDeadline);

  return {
    messages,
    conditions,
    setConditions,
    nextDeadline,
    lastCheckIn,
    isLoading,
    loadError,
    lastRefresh,
    handleCheckIn: handleDashboardCheckIn,
    navigate,
    userId,
    refreshConditions
  };
}
