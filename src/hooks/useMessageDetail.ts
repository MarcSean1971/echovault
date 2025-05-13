
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { getConditionByMessageId, getMessageDeadline } from "@/services/messages/conditionService";
import { Message } from "@/types/message";

/**
 * Custom hook for loading message details and conditions
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

  // Function to refresh condition and deadline data
  const refreshConditionData = useCallback(async () => {
    if (!messageId) return;
    
    try {
      console.log(`[useMessageDetail] Refreshing condition data for message ${messageId}`);
      const conditionData = await getConditionByMessageId(messageId);
      
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
  }, [messageId, fetchDeadline]);

  // Memoize the fetch function to prevent it from being recreated on every render
  const fetchMessage = useCallback(async () => {
    if (!userId || !messageId || hasAttemptedFetch) return;
    
    setIsLoading(true);
    setHasAttemptedFetch(true);
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('id', messageId)
        .single();
        
      if (error) throw error;
      
      setMessage(data as unknown as Message);
      
      // Initial fetch of condition data
      await refreshConditionData();
    } catch (error: any) {
      console.error("Error fetching message:", error);
      toast({
        title: "Error",
        description: "Failed to load the message",
        variant: "destructive"
      });
      onError();
    } finally {
      setIsLoading(false);
    }
  }, [userId, messageId, hasAttemptedFetch, refreshConditionData, onError]);

  // Use effect with the memoized fetch function
  useEffect(() => {
    fetchMessage();
  }, [fetchMessage]);

  // Add listener for condition updates
  useEffect(() => {
    const handleConditionUpdated = (event: Event) => {
      if (event instanceof CustomEvent) {
        console.log(`[useMessageDetail] Received conditions-updated event for ${messageId}, refreshing data...`, event.detail);
        
        // Refresh condition data to get the latest information
        refreshConditionData();
        
        // Increment counter to force downstream components to re-render
        setRefreshCount(prev => prev + 1);
      }
    };
    
    window.addEventListener('conditions-updated', handleConditionUpdated);
    return () => {
      window.removeEventListener('conditions-updated', handleConditionUpdated);
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
    refreshCount  // Add refresh counter to the return object
  };
}
