
import { useCallback, useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { fetchConditionsFromDb, invalidateConditionsCache } from '@/services/messages/conditions/operations/fetch-operations';

/**
 * Hook to provide a consistent way to refresh conditions data
 * This can be used by any component that needs to trigger a refresh
 */
export function useConditionRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Create a memoized refresh function
  const refreshConditions = useCallback(async (userId?: string) => {
    if (!userId) return null;
    
    try {
      console.log("Refreshing conditions data from useConditionRefresh");
      setIsRefreshing(true);
      
      // First, invalidate the cache to ensure we get fresh data
      invalidateConditionsCache(userId);
      
      // Then fetch the latest conditions
      const conditions = await fetchConditionsFromDb(userId);
      
      // If conditions were updated successfully, emit a custom event
      // that other components can listen for
      console.log("Broadcasting conditions-updated event");
      window.dispatchEvent(new CustomEvent('conditions-updated', { 
        detail: { 
          updatedAt: new Date().toISOString(),
          conditionsCount: conditions.length
        }
      }));
      
      return conditions;
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
  }, []);

  return { refreshConditions, isRefreshing };
}
