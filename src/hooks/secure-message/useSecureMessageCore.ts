
import { useState, useCallback, useEffect } from "react";
import { useMessageFetcher } from "./useMessageFetcher";
import { usePinVerification } from "./usePinVerification";

interface UseSecureMessageCoreParams {
  messageId: string | null;
  recipient: string | null;
  deliveryId: string | null;
}

export function useSecureMessageCore({ 
  messageId, 
  recipient, 
  deliveryId 
}: UseSecureMessageCoreParams) {
  const [retryCount, setRetryCount] = useState(0);
  
  // Log all parameters for debugging
  console.log("[SecureMessageCore] Initializing with params:", {
    messageId,
    recipient: recipient || "(not provided)",
    deliveryId: deliveryId || "(not provided)"
  });
  
  // Use the message fetcher hook
  const {
    loading,
    error,
    technicalDetails,
    htmlContent,
    messageData,
    condition,
    pinProtected,
    setPinProtected,
    fetchMessage
  } = useMessageFetcher({ messageId, recipient, deliveryId });
  
  // Use the PIN verification hook
  const {
    verifying,
    verifyError,
    verifyPin
  } = usePinVerification({ 
    messageId, 
    recipient, 
    deliveryId,
    fetchMessage,
    setPinProtected
  });
  
  // Handle iframe messages
  const handleIframeMessage = useCallback((event: MessageEvent) => {
    if (event.data?.type === 'PIN_SUBMIT') {
      verifyPin(event.data.pin);
    }
  }, [verifyPin]);
  
  // Retry fetching the message
  const handleRetry = useCallback(() => {
    console.log("[SecureMessage] Retrying message fetch, attempt:", retryCount + 1);
    setRetryCount(prev => prev + 1);
  }, [retryCount]);
  
  // Initial message fetch
  useEffect(() => {
    if (messageId) {
      console.log("[SecureMessage] Initializing with params:", { 
        messageId, 
        recipient: recipient || "(not provided)", 
        deliveryId: deliveryId || "(not provided)" 
      });
      fetchMessage();
    } else {
      console.error("[SecureMessage] Missing required parameter: messageId");
    }
  }, [messageId, recipient, deliveryId, retryCount, fetchMessage]);
  
  return {
    loading,
    error,
    technicalDetails,
    htmlContent,
    messageData,
    condition,
    pinProtected,
    verifying,
    verifyError,
    handleIframeMessage,
    handleRetry,
    verifyPin
  };
}
