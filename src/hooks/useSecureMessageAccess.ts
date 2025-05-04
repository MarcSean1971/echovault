
import { useState, useEffect } from "react";
import { useSecureMessageData } from "./useSecureMessageData";
import { usePinVerification } from "./secure-message/usePinVerification";

interface UseSecureMessageAccessParams {
  messageId: string | null;
  recipientEmail: string | null;
}

export function useSecureMessageAccess({ messageId, recipientEmail }: UseSecureMessageAccessParams) {
  const {
    loading,
    message,
    error,
    hasPinProtection
  } = useSecureMessageData({ messageId, recipientEmail });
  
  const [pinProtected, setPinProtected] = useState(false);
  
  const {
    verifyError: pinError,
    verifying: verifyingPin,
    verifyPin
  } = usePinVerification({ 
    messageId, 
    recipient: recipientEmail, 
    deliveryId: null,
    fetchMessage: () => Promise.resolve(),
    setPinProtected
  });
  
  // When data is loaded, set pin protection status
  useEffect(() => {
    if (!loading && hasPinProtection) {
      setPinProtected(true);
    } else if (!loading && !hasPinProtection) {
      setPinProtected(false);
    }
  }, [loading, hasPinProtection, setPinProtected]);

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
