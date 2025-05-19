
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { getConditionByMessageId, getMessageDeadline } from "@/services/messages/conditionService";
import { Message } from "@/types/message";
import { invalidateConditionsCache } from "@/services/messages/conditions/operations/fetch-operations";

/**
 * Custom hook for loading message details and conditions with optimized parallel loading
 */
export function useMessageDetail(messageId: string | undefined, onError: () => void) {
  const { userId } = useAuth();
  const [message, setMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isArmed, setIsArmed] = useState(false);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [conditionId, setConditionId] = useState<string | null>(null);
  const [condition, setCondition] = useState<any | null>(null);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  
  // Add a ref to track the last refresh time to prevent duplicate refreshes
  const lastRefreshTimeRef = useRef<number>(0);
  // Add a timeout ref to implement debouncing
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to fetch deadline for the message
  const fetchDeadline = useCallback(async (condId: string) => {
    if (!condId) return null;
    
    try {
      console.log(`[useMessageDetail] Fetching new deadline for condition ${condId}`);
      const deadlineDate = await getMessageDeadline(condId);
      console.log(`[useMessageDetail] New deadline fetched:`, deadlineDate);
      return deadlineDate;
    } catch (error) {
      console.error("Error fetching deadline:", error);
      return null;
    }
  }, []);

  // Optimized function to fetch condition data
  const fetchConditionData = useCallback(async (messageId: string) => {
    try {
      console.log(`[useMessageDetail] Fetching condition data for message ${messageId}`);
      const conditionData = await getConditionByMessageId(messageId);
      
      if (conditionData) {
        console.log(`[useMessageDetail] Condition data retrieved:`, conditionData);
        return conditionData;
      }
      return null;
    } catch (error) {
      console.error("Error fetching condition data:", error);
      return null;
    }
  }, []);

  // Function to fetch message directly from the database
  const fetchMessageData = useCallback(async (messageId: string, userId: string) => {
    try {
      console.log(`[useMessageDetail] Fetching message data for message ${messageId}`);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('id', messageId)
        .single();
        
      if (error) throw error;
      
      console.log(`[useMessageDetail] Message data retrieved:`, data);
      return data as unknown as Message;
    } catch (error) {
      console.error("Error fetching message data:", error);
      throw error;
    }
  }, []);

  // Function to refresh condition and deadline data with debouncing
  const refreshConditionData = useCallback(async () => {
    if (!messageId) return;
    
    // Check if we've refreshed recently (within last 2 seconds)
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < 2000) {
      console.log('[useMessageDetail] Skipping refresh, too soon after last refresh');
      return;
    }
    
    // Update last refresh time
    lastRefreshTimeRef.current = now;
    
    try {
      console.log(`[useMessageDetail] Refreshing condition data for message ${messageId}`);
      const conditionData = await fetchConditionData(messageId);
      
      if (conditionData) {
        setCondition(conditionData);
        setIsArmed(conditionData.active);
        setConditionId(conditionData.id);
        setLastCheckIn(conditionData.last_checked || null);
        
        if (conditionData.active) {
          const newDeadline = await fetchDeadline(conditionData.id);
          if (newDeadline) {
            console.log(`[useMessageDetail] Setting new deadline: ${newDeadline.toISOString()}`);
            // Create a new Date object to ensure React detects the change
            setDeadline(new Date(newDeadline.getTime()));
          }
        } else {
          setDeadline(null);
        }
        
        // Set recipients from condition data if available
        if (conditionData.recipients && Array.isArray(conditionData.recipients)) {
          setRecipients(conditionData.recipients);
        }
      }
    } catch (error) {
      console.error("Error refreshing condition data:", error);
    }
  }, [messageId, fetchConditionData, fetchDeadline]);

  // Main fetch function - now optimized to load data in parallel
  const fetchData = useCallback(async () => {
    if (!userId || !messageId || hasAttemptedFetch) return;
    
    setIsLoading(true);
    setHasAttemptedFetch(true);
    
    try {
      // Start fetching message and condition data in parallel
      const messagePromise = fetchMessageData(messageId, userId);
      const conditionPromise = fetchConditionData(messageId);
      
      // First, get the message data so we can show the basic UI right away
      try {
        const messageData = await messagePromise;
        setMessage(messageData);
        console.log(`[useMessageDetail] Message data set, UI can now render`);
        
        // We can lower the loading state once we have the basic message
        // This allows the UI to show the message while still loading other data
        setIsLoading(false);
      } catch (messageError) {
        console.error("Error fetching message:", messageError);
        toast({
          title: "Error",
          description: "Failed to load the message",
          variant: "destructive"
        });
        onError();
        return;
      }
      
      // Now get the condition data
      try {
        const conditionData = await conditionPromise;
        
        if (conditionData) {
          console.log(`[useMessageDetail] Processing condition data`);
          setCondition(conditionData);
          setIsArmed(conditionData.active);
          setConditionId(conditionData.id);
          setLastCheckIn(conditionData.last_checked || null);
          
          // Set recipients from condition data if available
          if (conditionData.recipients && Array.isArray(conditionData.recipients)) {
            setRecipients(conditionData.recipients);
          }
          
          // Finally, if the condition is active, fetch the deadline
          if (conditionData.active) {
            try {
              console.log(`[useMessageDetail] Fetching deadline for active condition`);
              const deadlineDate = await fetchDeadline(conditionData.id);
              if (deadlineDate) {
                console.log(`[useMessageDetail] Setting deadline: ${deadlineDate.toISOString()}`);
                setDeadline(new Date(deadlineDate.getTime()));
              }
            } catch (deadlineError) {
              console.error("Error fetching deadline:", deadlineError);
              // Non-critical error, UI can still function
            }
          }
        } else {
          console.log(`[useMessageDetail] No condition data found`);
        }
      } catch (conditionError) {
        console.error("Error fetching condition:", conditionError);
        // Non-critical error, UI can still show the message
      }
      
    } catch (error: any) {
      console.error("Fatal error in fetchData:", error);
      toast({
        title: "Error",
        description: "Failed to load message details",
        variant: "destructive"
      });
      onError();
    } finally {
      // Ensure loading is set to false in all cases
      setIsLoading(false);
    }
  }, [userId, messageId, hasAttemptedFetch, fetchMessageData, fetchConditionData, fetchDeadline, onError]);

  // Use effect with the memoized fetch function
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Optimized listener for condition updates with debouncing
  useEffect(() => {
    const handleConditionUpdated = (event: Event) => {
      if (event instanceof CustomEvent) {
        console.log(`[useMessageDetail] Received conditions-updated event, details:`, event.detail);
        
        // Clear existing timeout if there is one
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
        
        // Debounce the refresh to avoid multiple rapid refreshes
        refreshTimeoutRef.current = setTimeout(() => {
          console.log(`[useMessageDetail] Debounced refresh for message ${messageId}`);
          
          // Clear any cached data
          if (messageId) {
            invalidateConditionsCache();
          }
          
          // Refresh condition data to get the latest information
          refreshConditionData();
          
          // Increment counter to force downstream components to re-render
          // But only do it once per group of events
          setRefreshCount(prev => prev + 1);
          
          // Clear the timeout ref
          refreshTimeoutRef.current = null;
        }, 300); // 300ms debounce time
      }
    };
    
    window.addEventListener('conditions-updated', handleConditionUpdated);
    return () => {
      window.removeEventListener('conditions-updated', handleConditionUpdated);
      // Clear any pending timeout when component unmounts
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [messageId, refreshConditionData]);

  return {
    message,
    isLoading,
    isArmed,
    deadline,
    conditionId,
    condition,
    recipients,
    setIsArmed,
    lastCheckIn,
    refreshCount
  };
}
