
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { getConditionByMessageId, getMessageDeadline } from "@/services/messages/conditionService";
import { Message, MessageAttachment } from "@/types/message";

type DatabaseMessage = {
  id: string;
  title: string;
  content: string;
  message_type: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  share_location?: boolean;
  location_name?: string;
  location_latitude?: number;
  location_longitude?: number;
  attachments?: any;
};

/**
 * Convert database message to our app Message type
 */
function convertDatabaseMessageToMessage(dbMessage: DatabaseMessage): Message {
  // Process attachments to ensure they match MessageAttachment type
  let processedAttachments: MessageAttachment[] = [];
  
  if (dbMessage.attachments && Array.isArray(dbMessage.attachments)) {
    processedAttachments = dbMessage.attachments.map(attachment => ({
      id: attachment.id || "",
      message_id: attachment.message_id || dbMessage.id,
      file_name: attachment.file_name || attachment.name || "",
      file_size: attachment.file_size || attachment.size || 0,
      file_type: attachment.file_type || attachment.type || "",
      url: attachment.url || attachment.path || "",
      created_at: attachment.created_at || dbMessage.created_at,
      // Add optional properties if they exist
      path: attachment.path,
      name: attachment.name,
      size: attachment.size,
      type: attachment.type
    }));
  }
  
  // Convert to Message type
  const message: Message = {
    id: dbMessage.id,
    title: dbMessage.title,
    content: dbMessage.content || "",
    message_type: dbMessage.message_type as "text" | "audio" | "video",
    user_id: dbMessage.user_id,
    created_at: dbMessage.created_at,
    updated_at: dbMessage.updated_at,
    share_location: dbMessage.share_location || false,
    location_name: dbMessage.location_name,
    location_latitude: dbMessage.location_latitude,
    location_longitude: dbMessage.location_longitude,
    attachments: processedAttachments
  };
  
  return message;
}

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
      
      // Convert database result to our Message type
      const convertedMessage = convertDatabaseMessageToMessage(data as DatabaseMessage);
      setMessage(convertedMessage);
      
      // Check if message has a condition and if it's armed
      const conditionData = await getConditionByMessageId(messageId);
      if (conditionData) {
        setCondition(conditionData);
        setIsArmed(conditionData.active);
        setConditionId(conditionData.id);
        
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
    setIsArmed
  };
}
