
import { useState, useCallback, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UseSecureMessageParams {
  messageId: string | null;
  recipient: string | null;
  deliveryId: string | null;
}

export function useSecureMessage({ messageId, recipient, deliveryId }: UseSecureMessageParams) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [technicalDetails, setTechnicalDetails] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [pinProtected, setPinProtected] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const fetchMessage = useCallback(async () => {
    setLoading(true);
    setError(null);
    setTechnicalDetails(null);
    
    try {
      // Get Supabase URL from the supabase client
      const supabaseUrl = supabase.supabaseUrl;
      
      if (!supabaseUrl) {
        throw new Error("Supabase URL not configured");
      }
      
      console.log("[SecureMessage] Using Supabase URL:", supabaseUrl);
      
      // Extract project ID from Supabase URL to construct the edge function URL correctly
      const projectId = supabaseUrl.split("://")[1]?.split(".")[0];
      if (!projectId) {
        throw new Error("Failed to extract project ID from Supabase URL");
      }
      
      console.log("[SecureMessage] Extracted project ID:", projectId);
      
      // Construct the edge function URL with the full, correct path
      const apiUrl = `https://${projectId}.supabase.co/functions/v1/access-message?id=${messageId}&recipient=${encodeURIComponent(recipient || "")}&delivery=${deliveryId || ""}`;
      
      console.log("[SecureMessage] Requesting message from:", apiUrl);
      
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Accept": "text/html,application/xhtml+xml",
          "Content-Type": "text/html"
        }
      });
      
      console.log("[SecureMessage] Response status:", response.status);
      console.log("[SecureMessage] Response content type:", response.headers.get("Content-Type"));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[SecureMessage] Error response:", errorText);
        
        // Attempt to extract more detailed error info
        let technicalInfo = "";
        try {
          // Check if the error response is HTML
          if (errorText.includes('<html') || errorText.includes('<body')) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = errorText;
            technicalInfo = tempDiv.textContent || errorText;
          } else {
            technicalInfo = errorText;
          }
        } catch (parseError) {
          console.error("[SecureMessage] Error parsing error response:", parseError);
          technicalInfo = errorText.substring(0, 500); // Limit length
        }
        
        setTechnicalDetails(technicalInfo);
        throw new Error(`Server returned ${response.status} ${response.statusText}`);
      }
      
      const html = await response.text();
      console.log("[SecureMessage] Response HTML length:", html.length);
      
      if (html.length < 10) {
        throw new Error("Received empty or invalid response from server");
      }
      
      // Check if the response contains PIN form
      if (html.includes("pin-form")) {
        setPinProtected(true);
        setHtmlContent(html);
      } else {
        setHtmlContent(html);
      }
    } catch (err: any) {
      console.error("[SecureMessage] Error fetching message:", err);
      setError(err.message || "Failed to load the secure message");
      
      // Show toast for error
      toast({
        variant: "destructive",
        title: "Error loading message",
        description: err.message || "Failed to load the secure message"
      });
    } finally {
      setLoading(false);
    }
  }, [messageId, recipient, deliveryId]);
  
  // Verify PIN and reload message if correct
  const verifyPin = async (pinValue: string) => {
    if (!pinValue.trim()) {
      setVerifyError("Please enter a PIN");
      return;
    }
    
    setVerifying(true);
    setVerifyError(null);
    
    try {
      // Get Supabase URL from the supabase client
      const supabaseUrl = supabase.supabaseUrl;
      
      if (!supabaseUrl) {
        throw new Error("Supabase URL not configured");
      }
      
      // Extract project ID from Supabase URL
      const projectId = supabaseUrl.split("://")[1]?.split(".")[0];
      if (!projectId) {
        throw new Error("Failed to extract project ID from Supabase URL");
      }
      
      // Construct the edge function URL with the full, correct path
      const apiUrl = `https://${projectId}.supabase.co/functions/v1/access-message/verify-pin`;
      
      console.log("[SecureMessage] Verifying PIN at:", apiUrl);
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          pin: pinValue, 
          messageId, 
          deliveryId,
          recipientEmail: recipient
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        // Show error in parent window
        setVerifyError(data.error || "Incorrect PIN");
        return;
      }
      
      // PIN verified, fetch the message again
      setPinProtected(false);
      await fetchMessage();
      toast({
        title: "PIN Verified",
        description: "Message unlocked successfully",
      });
    } catch (err: any) {
      console.error("[SecureMessage] Error verifying PIN:", err);
      setVerifyError(err.message || "Error verifying PIN");
    } finally {
      setVerifying(false);
    }
  };
  
  // Handle iframe messages
  const handleIframeMessage = useCallback((event: MessageEvent) => {
    if (event.data.type === 'PIN_SUBMIT') {
      verifyPin(event.data.pin);
    }
  }, [messageId, deliveryId, recipient]);
  
  // Retry fetching the message
  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);
  
  // Initial message fetch
  useEffect(() => {
    if (messageId && (recipient || deliveryId)) {
      console.log("[SecureMessage] Initializing with params:", { messageId, recipient, deliveryId });
      fetchMessage();
    } else {
      console.error("[SecureMessage] Missing required parameters", { messageId, recipient, deliveryId });
      setError("Invalid message link. Missing required parameters.");
      setLoading(false);
    }
  }, [messageId, recipient, deliveryId, retryCount, fetchMessage]);
  
  return {
    loading,
    error,
    technicalDetails,
    htmlContent,
    pinProtected,
    verifying,
    verifyError,
    handleIframeMessage,
    handleRetry,
    verifyPin
  };
}
