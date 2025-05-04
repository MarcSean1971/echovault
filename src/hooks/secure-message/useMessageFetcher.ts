
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface UseMessageFetcherParams {
  messageId: string | null;
  recipient: string | null;
  deliveryId: string | null;
}

export function useMessageFetcher({ 
  messageId, 
  recipient, 
  deliveryId 
}: UseMessageFetcherParams) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [technicalDetails, setTechnicalDetails] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<any>(null);
  const [pinProtected, setPinProtected] = useState(false);
  const [messageData, setMessageData] = useState<any>(null);
  const [condition, setCondition] = useState<any>(null);
  
  const fetchMessage = useCallback(async () => {
    if (!messageId) {
      console.error("[useMessageFetcher] No message ID provided");
      setError("Message ID is required");
      setTechnicalDetails("Missing messageId parameter");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    setTechnicalDetails(null);
    setMessageData(null);
    setCondition(null);
    
    try {
      console.log("[useMessageFetcher] Fetching message:", messageId);
      console.log("[useMessageFetcher] Recipient:", recipient || "not provided");
      console.log("[useMessageFetcher] Delivery ID:", deliveryId || "not provided");
      
      // First get the message
      const { data: message, error: messageError } = await supabase
        .from("messages")
        .select("*")
        .eq("id", messageId)
        .single();
        
      if (messageError) {
        console.error("[useMessageFetcher] Message not found:", messageError);
        setError("Message not found");
        setTechnicalDetails(messageError.message);
        setLoading(false);
        return;
      }
      
      if (!message) {
        console.error("[useMessageFetcher] No message data returned");
        setError("Message not found");
        setTechnicalDetails("Database returned empty result");
        setLoading(false);
        return;
      }

      console.log("[useMessageFetcher] Message found:", message.id, message.title);
      setMessageData(message);
      
      // Next, check if this message has security conditions
      const { data: condition, error: conditionError } = await supabase
        .from("message_conditions")
        .select("*")
        .eq("message_id", messageId)
        .single();
        
      if (conditionError && conditionError.code !== 'PGRST116') { // Not found error
        console.error("[useMessageFetcher] Error fetching condition:", conditionError);
        // Continue without condition info
      } 
      
      if (condition) {
        console.log("[useMessageFetcher] Found message condition:", condition.condition_type);
        setCondition(condition);
        
        // Check if pin protected
        if (condition.pin_code) {
          console.log("[useMessageFetcher] PIN protection detected");
          setPinProtected(true);
          setLoading(false);
          return; // Don't return content yet, need PIN verification
        }
        
        // Check if recipient is authorized
        if (recipient && condition.recipients) {
          // Check if recipients is an array before using .some()
          const recipients = condition.recipients;
          let isAuthorized = false;
          
          if (Array.isArray(recipients)) {
            isAuthorized = recipients.some((r: any) => 
              r.email && r.email.toLowerCase() === recipient.toLowerCase()
            );
          }
          
          console.log("[useMessageFetcher] Recipient authorized:", isAuthorized);
          
          if (!isAuthorized) {
            setError("Unauthorized recipient");
            setTechnicalDetails(`The recipient ${recipient} is not authorized to view this message`);
            setLoading(false);
            return;
          }
        }
        
        // Track message view if delivery ID is provided
        if (deliveryId) {
          try {
            const { error: viewError } = await supabase
              .from("delivered_messages")
              .update({ 
                viewed_at: new Date().toISOString(),
                viewed_count: 1,
                device_info: navigator.userAgent
              })
              .eq("delivery_id", deliveryId)
              .eq("message_id", messageId);
              
            if (viewError) {
              console.error("[useMessageFetcher] Error tracking message view:", viewError);
              // Continue anyway
            } else {
              console.log("[useMessageFetcher] Message view tracked");
            }
          } catch (trackError) {
            console.error("[useMessageFetcher] Error tracking view:", trackError);
            // Continue anyway
          }
        }
      }
      
      // Set the message content
      setHtmlContent(message);
      setLoading(false);
    } catch (err: any) {
      console.error("[useMessageFetcher] Error fetching message:", err.message);
      setError("Error loading message");
      setTechnicalDetails(err.message);
      setLoading(false);
    }
  }, [messageId, recipient, deliveryId]);

  return {
    loading,
    error,
    technicalDetails,
    htmlContent,
    messageData,
    condition,
    pinProtected,
    setPinProtected,
    fetchMessage
  };
}
