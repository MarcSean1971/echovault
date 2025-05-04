
import { useState, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";

interface UsePinVerificationParams {
  messageId: string | null;
  recipient: string | null;
  deliveryId: string | null;
  fetchMessage: () => Promise<void>;
  setPinProtected: (isProtected: boolean) => void;
}

export function usePinVerification({ 
  messageId, 
  recipient, 
  deliveryId, 
  fetchMessage,
  setPinProtected
}: UsePinVerificationParams) {
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const verifyPin = useCallback(async (pin: string) => {
    if (!pin || !messageId) return;
    
    setVerifying(true);
    setVerifyError(null);
    
    try {
      console.log("[SecureMessage] Verifying PIN for message:", messageId);
      
      // Get the current hostname to use for determining API endpoint
      const currentHostname = window.location.hostname;
      
      // Fixed project ID for Supabase
      const projectId = "onwthrpgcnfydxzzmyot";
      
      // Get the Supabase anon key from the environment constant
      const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ud3RocnBnY25meWR4enpteW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDQzOTUsImV4cCI6MjA2MTY4MDM5NX0.v4tYEDukTlMERZ6GHqvnoDbyH-g9KQd8s3-UlIOPkDs";
      
      // Determine API endpoint based on current hostname
      let baseUrl: string;
      
      if (currentHostname !== `${projectId}.supabase.co` && 
          !currentHostname.includes('localhost') &&
          !currentHostname.includes('127.0.0.1')) {
        // Try with custom domain first
        baseUrl = `https://${currentHostname}`;
      } else {
        // Use direct Supabase URL
        baseUrl = `https://${projectId}.supabase.co`;
      }
      
      const apiUrl = `${baseUrl}/functions/v1/access-message/verify-pin`;
      console.log("[SecureMessage] PIN verification endpoint:", apiUrl);
      
      // Prepare the verification payload
      const verifyPayload = {
        messageId,
        pin,
        ...(recipient ? { recipient } : {}),
        ...(deliveryId ? { deliveryId } : {})
      };
      
      console.log("[SecureMessage] Sending verification payload:", verifyPayload);
      
      // Try the verification request
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          // Add origin header to help with CORS
          "Origin": window.location.origin
        },
        body: JSON.stringify(verifyPayload)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("[SecureMessage] PIN verification failed:", errorData);
        throw new Error(`PIN verification failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log("[SecureMessage] PIN verified successfully");
        toast({
          title: "PIN verified",
          description: "Viewing secure message content"
        });
        
        // Refresh the message content
        setPinProtected(false);
        fetchMessage();
      } else {
        console.error("[SecureMessage] PIN verification returned error:", data.message || "Invalid PIN");
        setVerifyError(data.message || "Invalid PIN. Please try again.");
      }
    } catch (err: any) {
      console.error("[SecureMessage] PIN verification error:", err);
      setVerifyError(err.message || "Error verifying PIN");
      
      // Attempt with direct Supabase URL if first attempt failed
      const isCustomDomainAttempt = !window.location.hostname.includes(messageId);
      if (isCustomDomainAttempt) {
        try {
          console.log("[SecureMessage] Retrying PIN verification with direct Supabase URL");
          await attemptDirectVerification(messageId, pin, recipient, deliveryId);
        } catch (fallbackErr) {
          console.error("[SecureMessage] Fallback verification also failed:", fallbackErr);
        }
      }
    } finally {
      setVerifying(false);
    }
  }, [messageId, recipient, deliveryId, fetchMessage, setPinProtected]);

  // Helper function to attempt verification directly with Supabase URL
  const attemptDirectVerification = async (
    messageId: string, 
    pin: string, 
    recipient: string | null, 
    deliveryId: string | null
  ) => {
    const projectId = "onwthrpgcnfydxzzmyot";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ud3RocnBnY25meWR4enpteW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDQzOTUsImV4cCI6MjA2MTY4MDM5NX0.v4tYEDukTlMERZ6GHqvnoDbyH-g9KQd8s3-UlIOPkDs";
    
    const apiUrl = `https://${projectId}.supabase.co/functions/v1/access-message/verify-pin`;
    console.log("[SecureMessage] Direct PIN verification endpoint:", apiUrl);
    
    const verifyPayload = {
      messageId,
      pin,
      ...(recipient ? { recipient } : {}),
      ...(deliveryId ? { deliveryId } : {})
    };
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(verifyPayload)
    });
    
    if (!response.ok) {
      throw new Error(`Direct PIN verification failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      console.log("[SecureMessage] Direct PIN verification succeeded");
      toast({
        title: "PIN verified",
        description: "Viewing secure message content"
      });
      
      // Refresh the message content
      setPinProtected(false);
      fetchMessage();
    } else {
      setVerifyError(data.message || "Invalid PIN. Please try again.");
    }
  };

  return {
    verifying,
    verifyError,
    verifyPin
  };
}
