
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
      
      setMessage(data as Message);
      
      // Check if message has a condition and if it's armed
      const conditionData = await getConditionByMessageId(messageId);
      if (conditionData) {
        setCondition(conditionData);
        setIsArmed(conditionData.active);
        setConditionId(conditionData.id);
        setLastCheckIn(conditionData.last_checked || null);
        
        if (conditionData.active) {
          const deadlineDate = await getMessageDeadline(conditionData.id);
          setDeadline(deadlineDate);
        }
        
        // Set recipients from condition data if available
        if (conditionData.recipients && Array.isArray(conditionData.recipients)) {
          setRecipients(conditionData.recipients);
        }
      }
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
  }, [userId, messageId, hasAttemptedFetch, onError]);

  // Use effect with the memoized fetch function
  useEffect(() => {
    fetchMessage();
  }, [fetchMessage]);

  return {
    message,
    isLoading,
    isArmed,
    deadline,
    conditionId,
    condition,
    recipients,
    setIsArmed,
    lastCheckIn
  };
}
