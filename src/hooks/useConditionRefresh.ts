
import { useCallback, useContext } from 'react';
import { useDashboardData } from './useDashboardData';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to provide a consistent way to refresh conditions data
 * This can be used by any component that needs to trigger a refresh
 */
export function useConditionRefresh() {
  const { userId } = useAuth();
  const { refreshConditions: refreshData } = useDashboardData();
  
  // Create a memoized refresh function
  const refreshConditions = useCallback(async () => {
    if (!userId) return null;
    
    try {
      console.log("Refreshing conditions data from useConditionRefresh");
      const updatedConditions = await refreshData();
      return updatedConditions;
    } catch (error) {
      console.error("Error refreshing conditions:", error);
      return null;
    }
  }, [userId, refreshData]);

  return { refreshConditions };
}
