
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
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
      
      // Get the message condition to verify the PIN
      const { data: condition, error: conditionError } = await supabase
        .from("message_conditions")
        .select("pin_code")
        .eq("message_id", messageId)
        .single();
        
      if (conditionError) {
        console.error("[SecureMessage] Error getting message condition:", conditionError);
        setVerifyError("Error verifying PIN: couldn't find message security settings");
        setVerifying(false);
        return;
      }
      
      if (!condition || !condition.pin_code) {
        console.error("[SecureMessage] No PIN condition found for message");
        setVerifyError("Error verifying PIN: message doesn't have PIN protection");
        setVerifying(false);
        return;
      }
      
      // Compare the PINs
      if (condition.pin_code !== pin) {
        console.error("[SecureMessage] Incorrect PIN provided");
        setVerifyError("Incorrect PIN. Please try again.");
        setVerifying(false);
        return;
      }
      
      console.log("[SecureMessage] PIN verified successfully");
      
      // Track message view if deliveryId is provided
      if (deliveryId) {
        try {
          const { error: trackError } = await supabase
            .from("delivered_messages")
            .update({ 
              viewed_at: new Date().toISOString(),
              viewed_count: 1,
              device_info: navigator.userAgent
            })
            .eq("delivery_id", deliveryId)
            .eq("message_id", messageId);
            
          if (trackError) {
            console.error("[SecureMessage] Error updating view status:", trackError);
            // Continue anyway
          } else {
            console.log("[SecureMessage] Message view status updated");
          }
        } catch (e) {
          console.error("[SecureMessage] Error updating view status:", e);
          // Continue anyway
        }
      }
      
      toast({
        title: "PIN verified",
        description: "Viewing secure message content"
      });
      
      // Unlock the message
      setPinProtected(false);
      fetchMessage();
      
    } catch (err: any) {
      console.error("[SecureMessage] PIN verification error:", err);
      setVerifyError(err.message || "Error verifying PIN");
    } finally {
      setVerifying(false);
    }
  }, [messageId, deliveryId, fetchMessage, setPinProtected]);

  return {
    verifying,
    verifyError,
    verifyPin
  };
}
