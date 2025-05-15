
import { useCallback, useState } from 'react';
import { useDashboardData } from './useDashboardData';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to provide a consistent way to refresh conditions data with improved error handling
 * This can be used by any component that needs to trigger a refresh
 */
export function useConditionRefresh() {
  const { userId } = useAuth();
  const { refreshConditions: refreshData } = useDashboardData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  
  // Check if we're online
  const checkNetworkStatus = () => {
    return navigator.onLine;
  };
  
  // Refresh auth tokens before critical operations
  const refreshAuthToken = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error("Error refreshing authentication token:", error);
        throw error;
      }
      return data.session !== null;
    } catch (err) {
      console.error("Failed to refresh auth token:", err);
      return false;
    }
  };
  
  // Create a memoized refresh function with retry logic
  const refreshConditions = useCallback(async () => {
    if (!userId) return null;
    
    try {
      // Check if we're online first
      if (!checkNetworkStatus()) {
        console.warn("Network appears to be offline. Cannot refresh conditions.");
        toast({
          title: "You're offline",
          description: "Please check your internet connection and try again",
          variant: "destructive"
        });
        return null;
      }
      
      console.log("Refreshing conditions data from useConditionRefresh");
      setIsRefreshing(true);
      
      // Try to refresh auth token first for critical operations
      await refreshAuthToken();
      
      const updatedConditions = await refreshData();
      
      // If conditions were updated successfully, emit a custom event
      // that other components can listen for
      if (updatedConditions) {
        console.log("Broadcasting conditions-updated event");
        window.dispatchEvent(new CustomEvent('conditions-updated', { 
          detail: { updatedAt: new Date().toISOString() }
        }));
        
        // Reset retry count on success
        setRetryCount(0);
      }
      
      return updatedConditions;
    } catch (error) {
      console.error("Error refreshing conditions:", error);
      
      // Implement retry logic with exponential backoff
      if (retryCount < MAX_RETRIES) {
        const nextRetry = retryCount + 1;
        setRetryCount(nextRetry);
        
        // Exponential backoff: 1s, 2s, 4s
        const backoffTime = Math.pow(2, retryCount) * 1000;
        
        console.log(`Retrying refresh (${nextRetry}/${MAX_RETRIES}) in ${backoffTime / 1000}s...`);
        toast({
          title: "Retrying connection",
          description: `Attempt ${nextRetry} of ${MAX_RETRIES}...`,
          duration: 3000,
        });
        
        // Set up retry after backoff
        setTimeout(() => {
          refreshConditions();
        }, backoffTime);
      } else {
        // Max retries reached
        toast({
          title: "Error refreshing message data",
          description: "Please try again later or reload the page",
          variant: "destructive"
        });
      }
      
      return null;
    } finally {
      setIsRefreshing(false);
    }
  }, [userId, refreshData, retryCount]);

  return { refreshConditions, isRefreshing };
}
