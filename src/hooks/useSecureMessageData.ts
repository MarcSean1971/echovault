
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
        throw new Error("No message ID provided");
      }
      
      // First get the message
      const { data: message, error: messageError } = await supabase
        .from("messages")
        .select("*")
        .eq("id", messageId)
        .single();
        
      if (messageError) {
        throw new Error("Message not found");
      }
      
      // Next, check if this message has security conditions
      const { data: condition, error: conditionError } = await supabase
        .from("message_conditions")
        .select("*")
        .eq("message_id", messageId)
        .single();
        
      if (conditionError) {
        console.error("Error fetching condition:", conditionError);
        // Continue without condition info
      } else {
        // Check if pin protected
        if (condition.pin_code) {
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
          
          if (!isAuthorized) {
            throw new Error("You are not authorized to view this message");
          }
        }
      }
      
      setMessage(message);
    } catch (err: any) {
      console.error("Error fetching message:", err);
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
    hasPinProtection
  };
}
