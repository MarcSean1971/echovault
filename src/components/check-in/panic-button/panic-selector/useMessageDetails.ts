
import { useState, useEffect } from "react";
import { MessageCondition } from "@/types/message";
import { supabase } from "@/integrations/supabase/client";
import { MessageDetails } from "../types";

export function useMessageDetails(messages: MessageCondition[]) {
  const [messageDetails, setMessageDetails] = useState<Record<string, MessageDetails>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch message details when the component mounts or messages change
  useEffect(() => {
    const fetchMessageDetails = async () => {
      if (!messages.length) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      const details: Record<string, MessageDetails> = {};
      
      // Get all message IDs
      const messageIds = messages.map(condition => condition.message_id);
      
      try {
        // Fetch message details from the database
        const { data, error } = await supabase
          .from("messages")
          .select("id, title, content, attachments")
          .in("id", messageIds);
        
        if (error) throw error;
        
        // Create a mapping of message ID to details
        if (data) {
          data.forEach(message => {
            const condition = messages.find(c => c.message_id === message.id);
            const recipientCount = condition?.recipients?.length || 0;
            
            // Ensure attachments is always treated as an array
            const attachments = Array.isArray(message.attachments) 
              ? message.attachments 
              : message.attachments ? [message.attachments] : [];
            
            details[message.id] = {
              id: message.id,
              title: message.title,
              content: message.content,
              attachments,
              recipientCount
            };
          });
        }
        
        setMessageDetails(details);
      } catch (error) {
        console.error("Error fetching message details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMessageDetails();
  }, [messages]);

  // Helper function to get attachment info
  const getAttachmentInfo = (messageId: string) => {
    const details = messageDetails[messageId];
    if (!details || !details.attachments || !details.attachments.length) return null;
    
    const attachments = details.attachments;
    const counts = {
      text: 0,
      video: 0,
      audio: 0,
      other: 0
    };
    
    attachments.forEach(attachment => {
      if (attachment.type?.includes('text')) counts.text++;
      else if (attachment.type?.includes('video')) counts.video++;
      else if (attachment.type?.includes('audio')) counts.audio++;
      else counts.other++;
    });
    
    return { counts, total: attachments.length };
  };

  return {
    messageDetails,
    isLoading,
    getAttachmentInfo
  };
}
