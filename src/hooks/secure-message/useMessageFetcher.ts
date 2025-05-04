
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
      
      // Determine if we should use direct Supabase URL or attempt with custom domain
      let useCustomDomain = false;
      let customDomain = "";
      
      // If we're on a custom domain, see if we should try using it
      if (currentHostname !== `${projectId}.supabase.co` && 
          !currentHostname.includes('localhost') &&
          !currentHostname.includes('127.0.0.1')) {
        useCustomDomain = true;
        customDomain = `https://${currentHostname}`;
        console.log("[SecureMessage] Detected custom domain:", customDomain);
      }
      
      // First try with the current domain if it's a custom domain
      if (useCustomDomain) {
        try {
          console.log("[SecureMessage] Attempting to fetch with custom domain first");
          const result = await attemptMessageFetch(customDomain, messageId, recipient, deliveryId, SUPABASE_ANON_KEY);
          
          if (result.success) {
            setHtmlContent(result.html);
            setPinProtected(result.isPinProtected);
            setLoading(false);
            return;
          }
          console.log("[SecureMessage] Custom domain attempt failed, falling back to Supabase domain");
        } catch (customDomainError) {
          console.warn("[SecureMessage] Error with custom domain fetch:", customDomainError);
          // Continue to fallback
        }
      }
      
      // Fallback to direct Supabase URL
      console.log("[SecureMessage] Using direct Supabase URL");
      const result = await attemptMessageFetch(
        `https://${projectId}.supabase.co`, 
        messageId, 
        recipient, 
        deliveryId, 
        SUPABASE_ANON_KEY
      );
      
      if (result.success) {
        setHtmlContent(result.html);
        setPinProtected(result.isPinProtected);
      } else {
        throw new Error(result.error || "Failed to load the secure message");
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

  // Helper function to attempt fetching the message from a specific domain
  async function attemptMessageFetch(
    domainUrl: string, 
    messageId: string, 
    recipient: string | null, 
    deliveryId: string | null,
    authKey: string
  ) {
    let apiUrl = `${domainUrl}/functions/v1/access-message?id=${encodeURIComponent(messageId)}`;
      
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
        "apikey": authKey,
        "Authorization": `Bearer ${authKey}`,
        // Add origin header to help with CORS
        "Origin": window.location.origin
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
        technicalInfo += `\n\nDiagnostic Info:\n- Current URL: ${window.location.href}\n- Current host: ${window.location.host}\n- API endpoint: ${domainUrl}\n- Message ID: ${messageId}\n- Delivery ID: ${deliveryId || "(not provided)"}\n- Recipient: ${recipient || "(not provided)"}`;
        
      } catch (parseError) {
        console.error("[SecureMessage] Error parsing error response:", parseError);
        technicalInfo = errorText.substring(0, 500); // Limit length
      }
      
      setTechnicalDetails(technicalInfo);
      return {
        success: false,
        error: `Server returned ${response.status} ${response.statusText}`,
        technicalInfo
      };
    }
    
    const html = await response.text();
    console.log("[SecureMessage] Response HTML length:", html.length);
    
    if (html.length < 10) {
      return {
        success: false,
        error: "Received empty or invalid response from server"
      };
    }
    
    // Check if the response contains PIN form - with improved detection
    const isPinProtected = html.includes('<div class="pin-form">') || 
                          html.includes('<form id="pin-form">') || 
                          (html.includes("pin-form") && html.includes("PIN Protected Message"));
                          
    console.log("[SecureMessage] PIN protection detected:", isPinProtected);
    
    return {
      success: true,
      html,
      isPinProtected
    };
  }

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
