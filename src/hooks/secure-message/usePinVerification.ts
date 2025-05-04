
import { useState, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UsePinVerificationParams {
  messageId: string | null;
  recipient: string | null;
  deliveryId: string | null;
  fetchMessage: () => Promise<void>;
  setPinProtected: (value: boolean) => void;
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
  
  // Verify PIN and reload message if correct
  const verifyPin = useCallback(async (pinValue: string) => {
    if (!pinValue.trim()) {
      setVerifyError("Please enter a PIN");
      return;
    }
    
    setVerifying(true);
    setVerifyError(null);
    
    try {
      // Use hardcoded project ID instead of accessing protected supabaseUrl
      const projectId = "onwthrpgcnfydxzzmyot";
      
      // Get the Supabase anon key from the client configuration
      const SUPABASE_ANON_KEY = supabase.supabaseKey;
      console.log("[SecureMessage] Using authorization key for PIN verification:", SUPABASE_ANON_KEY ? "Key available" : "Key missing");
      
      // Construct the edge function URL with the project ID
      const apiUrl = `https://${projectId}.supabase.co/functions/v1/access-message/verify-pin`;
      
      console.log("[SecureMessage] Verifying PIN at:", apiUrl);
      console.log("[SecureMessage] PIN verification parameters:", { 
        messageId, 
        deliveryId: deliveryId || "(not provided)",
        recipientEmail: recipient || "(not provided)"
      });
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add Supabase authentication headers
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
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
  }, [messageId, recipient, deliveryId, fetchMessage, setPinProtected]);

  return {
    verifying,
    verifyError,
    verifyPin
  };
}
