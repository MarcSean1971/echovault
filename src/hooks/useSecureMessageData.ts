
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface UseSecureMessageDataParams {
  messageId: string | null;
  recipientEmail: string | null;
}

export function useSecureMessageData({ messageId, recipientEmail }: UseSecureMessageDataParams) {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPinProtection, setHasPinProtection] = useState(false);
  
  // Fetch the message data directly from Supabase
  const fetchMessage = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!messageId) {
        console.error("[useSecureMessageData] No message ID provided");
        throw new Error("No message ID provided");
      }
      
      console.log("[useSecureMessageData] Fetching message:", messageId);
      console.log("[useSecureMessageData] Recipient:", recipientEmail);
      
      // First get the message
      const { data: message, error: messageError } = await supabase
        .from("messages")
        .select("*")
        .eq("id", messageId)
        .single();
        
      if (messageError) {
        console.error("[useSecureMessageData] Message not found:", messageError);
        throw new Error("Message not found");
      }
      
      if (!message) {
        console.error("[useSecureMessageData] No message data returned");
        throw new Error("Message not found");
      }

      console.log("[useSecureMessageData] Message found:", message.id, message.title);
      
      // Next, check if this message has security conditions
      const { data: condition, error: conditionError } = await supabase
        .from("message_conditions")
        .select("*")
        .eq("message_id", messageId)
        .single();
        
      if (conditionError) {
        console.error("[useSecureMessageData] Error fetching condition:", conditionError);
        // Continue without condition info
      } else {
        // Check if pin protected
        if (condition.pin_code) {
          console.log("[useSecureMessageData] PIN protection detected");
          setHasPinProtection(true);
        }
        
        // Check if recipient is authorized
        if (recipientEmail && condition.recipients) {
          // Check if recipients is an array before using .some()
          const recipients = condition.recipients;
          let isAuthorized = false;
          
          if (Array.isArray(recipients)) {
            isAuthorized = recipients.some((r: any) => 
              r.email && r.email.toLowerCase() === recipientEmail.toLowerCase()
            );
          }
          
          console.log("[useSecureMessageData] Recipient authorized:", isAuthorized);
          
          if (!isAuthorized) {
            throw new Error("You are not authorized to view this message");
          }
        }
      }
      
      setMessage(message);
    } catch (err: any) {
      console.error("[useSecureMessageData] Error fetching message:", err.message);
      setError(err.message || "Failed to load the message");
      toast({
        variant: "destructive",
        title: "Error loading message",
        description: err.message || "Failed to load the message"
      });
    } finally {
      setLoading(false);
    }
  }, [messageId, recipientEmail]);

  // Initial message fetch
  useEffect(() => {
    fetchMessage();
  }, [fetchMessage]);

  return {
    loading,
    message,
    error,
    hasPinProtection,
    refetch: fetchMessage
  };
}
