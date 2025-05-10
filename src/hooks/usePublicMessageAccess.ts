
import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Message } from "@/types/message";
import { supabase } from "@/integrations/supabase/client";
import { useSecurityConstraints } from "@/hooks/message-access/useSecurityConstraints";

interface PublicMessageAccessProps {
  messageId?: string;
  deliveryId?: string | null;
  recipientEmail?: string | null;
  isPreviewMode?: boolean;
}

export function usePublicMessageAccess(props?: PublicMessageAccessProps) {
  const [isPinRequired, setIsPinRequired] = useState(false);
  const [isUnlockDelayed, setIsUnlockDelayed] = useState(false);
  const [unlockTime, setUnlockTime] = useState<Date>(new Date());
  const [isVerified, setIsVerified] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { convertDatabaseMessageToMessage } = useSecurityConstraints();
  const { id } = useParams<{ id: string }>();
  
  // Use either the provided messageId or the one from URL params
  const messageId = props?.messageId || id;
  
  const verifyPin = (pinCode: string) => {
    // In a real implementation, this would verify against the stored pin
    // For now, we'll just accept any non-empty pin
    if (pinCode.trim()) {
      setIsVerified(true);
      return true;
    }
    return false;
  };
  
  const handleUnlockExpired = () => {
    setIsUnlockDelayed(false);
  };
  
  const fetchMessage = useCallback(async () => {
    if (!messageId) {
      setError("No message ID provided");
      setIsLoading(false);
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('id', messageId)
        .single();
        
      if (fetchError) {
        setError(fetchError.message);
        setIsLoading(false);
        return null;
      }
      
      if (!data) {
        setError("Message not found");
        setIsLoading(false);
        return null;
      }
      
      const convertedMessage = convertDatabaseMessageToMessage(data);
      setMessage(convertedMessage);
      setIsLoading(false);
      return convertedMessage;
    } catch (err) {
      console.error("Error fetching message:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setIsLoading(false);
      return null;
    }
  }, [messageId, convertDatabaseMessageToMessage]);
  
  return {
    isPinRequired,
    isUnlockDelayed,
    unlockTime,
    isVerified,
    message,
    isLoading,
    verifyPin,
    handleUnlockExpired,
    fetchMessage,
    error
  };
}
