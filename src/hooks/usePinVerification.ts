
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface UsePinVerificationParams {
  messageId: string | null;
  recipientEmail: string | null;
}

export function usePinVerification({ messageId, recipientEmail }: UsePinVerificationParams) {
  const [pinError, setPinError] = useState<string | null>(null);
  const [verifyingPin, setVerifyingPin] = useState(false);
  const [pinProtected, setPinProtected] = useState(true);
  
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
      if (!messageId) {
        throw new Error("No message ID provided");
      }
      
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
        
        toast({
          title: "PIN Verified",
          description: "Message unlocked successfully",
        });
        
        // Record the view if we have a recipient email
        if (recipientEmail) {
          await supabase
            .from("delivered_messages")
            .update({ viewed_count: 1 })
            .eq("message_id", messageId)
            .eq("recipient_id", recipientEmail);
        }
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

  return {
    pinError,
    verifyingPin,
    pinProtected,
    verifyPin,
    setPinProtected
  };
}
