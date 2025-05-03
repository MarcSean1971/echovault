
import { useCallback, useContext, useState } from 'react';
import { useDashboardData } from './useDashboardData';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

/**
 * Hook to provide a consistent way to refresh conditions data
 * This can be used by any component that needs to trigger a refresh
 */
export function useConditionRefresh() {
  const { userId } = useAuth();
  const { refreshConditions: refreshData } = useDashboardData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Create a memoized refresh function
  const refreshConditions = useCallback(async () => {
    if (!userId) return null;
    
    try {
      console.log("Refreshing conditions data from useConditionRefresh");
      setIsRefreshing(true);
      const updatedConditions = await refreshData();
      
      // If conditions were updated successfully, emit a custom event
      // that other components can listen for
      if (updatedConditions) {
        console.log("Broadcasting conditions-updated event");
        window.dispatchEvent(new CustomEvent('conditions-updated', { 
          detail: { updatedAt: new Date().toISOString() }
        }));
      }
      
      return updatedConditions;
    } catch (error) {
      console.error("Error refreshing conditions:", error);
      toast({
        title: "Error refreshing message data",
        description: "Please try again or reload the page",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsRefreshing(false);
    }
  }, [userId, refreshData]);

  return { refreshConditions, isRefreshing };
}
