
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { fetchMessages } from "@/services/messages/messageService";
import { fetchConditionsFromDb, invalidateConditionsCache } from "@/services/messages/conditions/operations/fetch-operations";
import { getNextCheckInDeadline } from "@/services/messages/conditionService"; 
import { MessageCondition, Message } from "@/types/message";

/**
 * Hook for fetching and managing dashboard data
 * Refactored to avoid circular dependencies and improve error handling
 */
export function useDashboardData() {
  const { userId } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [conditions, setConditions] = useState<MessageCondition[]>([]);
  const [nextDeadline, setNextDeadline] = useState<Date | null>(null);
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Fetch dashboard data with retry logic
  const loadDashboardData = useCallback(async (retryCount = 0) => {
    if (!userId) return;
    
    setIsLoading(true);
    setLoadError(null);
    
    try {
      console.log("Loading dashboard data, retry:", retryCount);
      
      // Fetch messages and conditions with increased timeout
      const messagesPromise = fetchMessages().catch(error => {
        console.error("Error fetching messages:", error);
        return [];
      });
      
      // Invalidate cache first to ensure fresh data
      if (retryCount > 0) invalidateConditionsCache(userId);
      
      const conditionsPromise = fetchConditionsFromDb(userId).catch(error => {
        console.error("Error fetching conditions:", error);
        throw error; // We need conditions data, so let this propagate
      });
      
      // Use Promise.allSettled to handle partial success
      const [messagesResult, conditionsResult] = await Promise.allSettled([
        messagesPromise,
        conditionsPromise
      ]);
      
      // Process messages result
      if (messagesResult.status === 'fulfilled') {
        setMessages(messagesResult.value);
      }
      
      // Process conditions result - critical data
      if (conditionsResult.status === 'fulfilled') {
        const conditionsData = conditionsResult.value;
        setConditions(conditionsData);
        
        // Extract last check-in info from conditions data
        if (conditionsData && conditionsData.length > 0) {
          const mostRecent = conditionsData.reduce(
            (latest, condition) => {
              if (!condition.last_checked) return latest;
              const lastChecked = new Date(condition.last_checked);
              return lastChecked > latest ? lastChecked : latest;
            },
            new Date(0) // start with epoch
          );
          
          setLastCheckIn(mostRecent.toISOString());
        }
      } else {
        // If we couldn't get conditions, retry or show error
        if (retryCount < 2) {
          console.log(`Retrying conditions fetch, attempt ${retryCount + 1}`);
          setTimeout(() => loadDashboardData(retryCount + 1), 1000);
          return;
        } else {
          throw new Error("Failed to load conditions data after retries");
        }
      }
      
      // Get next check-in deadline - fixed function call
      try {
        const deadlineResult = await getNextCheckInDeadline();
        setNextDeadline(deadlineResult ? deadlineResult : null);
      } catch (deadlineError) {
        console.error("Error fetching next deadline:", deadlineError);
        // Non-critical, so we don't throw here
      }
      
    } catch (error: any) {
      console.error("Error loading dashboard data:", error);
      setLoadError(error?.message || "Could not load trigger system data");
      toast({
        title: "Error",
        description: "Could not load trigger system data. Please refresh the page or try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Initial data loading
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Memoize refreshConditions to prevent unnecessary re-renders and avoid circular imports
  const refreshConditions = useCallback(async () => {
    if (!userId) return null;
    
    console.log("Refreshing conditions in useDashboardData");
    setIsLoading(true);
    
    try {
      // First invalidate cache to ensure fresh data
      invalidateConditionsCache(userId);
      
      // Refresh both messages and conditions
      const [messagesData, updatedConditions] = await Promise.all([
        fetchMessages(),
        fetchConditionsFromDb(userId)
      ]);
      
      setMessages(messagesData);
      setConditions(updatedConditions);
      
      // Also refresh the next deadline - fixed function call
      const deadlineResult = await getNextCheckInDeadline();
      setNextDeadline(deadlineResult ? deadlineResult : null);
      
      return updatedConditions;
    } catch (error) {
      console.error("Failed to refresh conditions:", error);
      toast({
        title: "Error",
        description: "Could not refresh conditions. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  return {
    messages,
    conditions,
    setConditions,
    nextDeadline,
    setNextDeadline,
    lastCheckIn,
    setLastCheckIn,
    isLoading,
    loadError,
    userId,
    refreshConditions
  };
}
