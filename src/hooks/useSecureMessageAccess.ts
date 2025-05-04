
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseSecureMessageAccessParams {
  messageId: string | null;
  recipientEmail: string | null;
}

export function useSecureMessageAccess({ messageId, recipientEmail }: UseSecureMessageAccessParams) {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [pinProtected, setPinProtected] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [verifyingPin, setVerifyingPin] = useState(false);

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
          setPinProtected(true);
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
    } finally {
      setLoading(false);
    }
  }, [messageId, recipientEmail]);
  
  // Handle PIN verification
  const verifyPin = async (e: React.FormEvent, pin: string) => {
    e.preventDefault();
    if (!pin.trim()) {
      setPinError("Please enter a PIN");
      return;
    }
    
    setVerifyingPin(true);
    setPinError(null);
    
    try {
      // Get the message condition to compare PIN
      const { data: condition, error } = await supabase
        .from("message_conditions")
        .select("pin_code")
        .eq("message_id", messageId)
        .single();
      
      if (error) {
        throw new Error("Error verifying PIN");
      }
      
      // Compare PINs
      if (condition.pin_code === pin) {
        // PIN matches, show the message
        setPinProtected(false);
        
        // Record the view
        await supabase
          .from("delivered_messages")
          .update({ viewed_count: 1 })
          .eq("message_id", messageId)
          .eq("recipient_id", recipientEmail);
      } else {
        setPinError("Incorrect PIN");
      }
    } catch (err: any) {
      console.error("Error verifying PIN:", err);
      setPinError(err.message || "Error verifying PIN");
    } finally {
      setVerifyingPin(false);
    }
  };

  // Initial message fetch
  useEffect(() => {
    fetchMessage();
  }, [fetchMessage]);

  return {
    loading,
    message,
    error,
    pinProtected,
    pinError,
    verifyingPin,
    verifyPin
  };
}
