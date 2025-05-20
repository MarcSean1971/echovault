
import { useCallback, useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { fetchConditionsFromDb, invalidateConditionsCache } from '@/services/messages/conditions/operations/fetch-operations';

/**
 * Hook to provide a consistent way to refresh conditions data
 * This can be used by any component that needs to trigger a refresh
 */
export function useConditionRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  
  // Create a memoized refresh function
  const refreshConditions = useCallback(async (userId?: string) => {
    if (!userId) {
      console.log("useConditionRefresh: No userId provided, cannot refresh");
      return null;
    }
    
    try {
      console.log(`useConditionRefresh: Refreshing conditions data for user ${userId}, retry: ${retryCount}`);
      setIsRefreshing(true);
      
      // First, invalidate the cache to ensure we get fresh data
      invalidateConditionsCache(userId);
      
      // Then fetch the latest conditions with a timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), 10000)
      );
      
      // Race between the data fetch and the timeout
      const conditions = await Promise.race([
        fetchConditionsFromDb(userId),
        timeoutPromise
      ]) as any;
      
      // Reset retry count on success
      setRetryCount(0);
      
      // If conditions were updated successfully, emit a custom event
      // that other components can listen for
      console.log(`useConditionRefresh: Broadcasting conditions-updated event with ${conditions?.length || 0} conditions`);
      window.dispatchEvent(new CustomEvent('conditions-updated', { 
        detail: { 
          updatedAt: new Date().toISOString(),
          conditionsCount: conditions?.length || 0,
          userId
        }
      }));
      
      return conditions;
    } catch (error) {
      console.error("useConditionRefresh: Error refreshing conditions:", error);
      
      // Implement retry logic
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        console.log(`useConditionRefresh: Retrying (${retryCount + 1}/${MAX_RETRIES})...`);
        
        // Wait for a short delay before retrying
        setTimeout(() => {
          refreshConditions(userId);
        }, 1000 * (retryCount + 1)); // Exponential backoff
      } else {
        toast({
          title: "Error refreshing data",
          description: "Please try again or reload the page",
          variant: "destructive"
        });
      }
      
      return null;
    } finally {
      setIsRefreshing(false);
    }
  }, [retryCount]);

  return { refreshConditions, isRefreshing, retryCount };
}
