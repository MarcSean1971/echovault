import { useState, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UseMessageFetcherParams {
  messageId: string | null;
  recipient: string | null;
  deliveryId: string | null;
}

export function useMessageFetcher({ messageId, recipient, deliveryId }: UseMessageFetcherParams) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [technicalDetails, setTechnicalDetails] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [pinProtected, setPinProtected] = useState(false);

  const fetchMessage = useCallback(async () => {
    setLoading(true);
    setError(null);
    setTechnicalDetails(null);
    
    try {
      // Validate required parameters
      if (!messageId) {
        throw new Error("Invalid message link. Missing message ID parameter.");
      }
      
      if (!deliveryId) {
        console.warn("[SecureMessage] Missing delivery ID parameter, this may cause issues");
        // Continue anyway, as the backend can potentially handle this
      }
      
      // Get the current hostname to use for diagnostic logging
      const currentHostname = window.location.hostname;
      console.log("[SecureMessage] Current hostname:", currentHostname);
      console.log("[SecureMessage] Current URL:", window.location.href);
      
      // Fixed project ID for Supabase
      const projectId = "onwthrpgcnfydxzzmyot";
      
      console.log("[SecureMessage] Using project ID:", projectId);
      console.log("[SecureMessage] Access parameters:", { 
        messageId, 
        recipient: recipient || "(not provided)", 
        deliveryId: deliveryId || "(not provided)"
      });
      
      // Get the Supabase anon key from the environment constant
      const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ud3RocnBnY25meWR4enpteW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDQzOTUsImV4cCI6MjA2MTY4MDM5NX0.v4tYEDukTlMERZ6GHqvnoDbyH-g9KQd8s3-UlIOPkDs";
      console.log("[SecureMessage] Using authorization key:", SUPABASE_ANON_KEY ? "Key available" : "Key missing");
      
      // Construct the edge function URL with the project ID
      let apiUrl = `https://${projectId}.supabase.co/functions/v1/access-message?id=${encodeURIComponent(messageId)}`;
      
      // Add recipient and delivery parameters if available
      if (recipient) {
        apiUrl += `&recipient=${encodeURIComponent(recipient)}`;
      }
      
      if (deliveryId) {
        apiUrl += `&delivery=${encodeURIComponent(deliveryId)}`;
      }
      
      console.log("[SecureMessage] Requesting message from:", apiUrl);
      
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Accept": "text/html,application/xhtml+xml",
          "Content-Type": "text/html",
          // Add Supabase authentication headers
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
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
          
          // Add diagnostics about URL and current location
          technicalInfo += `\n\nDiagnostic Info:\n- Current URL: ${window.location.href}\n- Current host: ${window.location.host}\n- API endpoint: ${projectId}.supabase.co\n- Message ID: ${messageId}\n- Delivery ID: ${deliveryId || "(not provided)"}\n- Recipient: ${recipient || "(not provided)"}`;
          
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
      
      // Check if the response contains PIN form - with improved detection
      // The improved logic makes sure we don't just detect the string anywhere in the content
      // but specifically look for the PIN form structure
      const isPinProtected = html.includes('<div class="pin-form">') || 
                             html.includes('<form id="pin-form">') || 
                             (html.includes("pin-form") && html.includes("PIN Protected Message"));
                             
      console.log("[SecureMessage] PIN protection detected:", isPinProtected);
      
      setPinProtected(isPinProtected);
      setHtmlContent(html);
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

  return {
    loading,
    error,
    technicalDetails,
    htmlContent,
    pinProtected,
    setPinProtected,
    fetchMessage
  };
}
