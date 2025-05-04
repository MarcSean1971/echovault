
import { useSearchParams } from "react-router-dom";
import { MessageLoader } from "@/components/secure-message/MessageLoader";
import { ErrorDisplay } from "@/components/secure-message/ErrorDisplay";
import { PinProtectedMessage } from "@/components/secure-message/PinProtectedMessage";
import { MessageContent } from "@/components/secure-message/MessageContent";
import { useSecureMessageData } from "@/hooks/useSecureMessageData";
import { usePinVerification } from "@/hooks/usePinVerification";
import { useState, useEffect } from "react";

export default function SecureMessage() {
  const [searchParams] = useSearchParams();
  const messageId = searchParams.get("id");
  const recipientEmail = searchParams.get("recipient");
  const deliveryId = searchParams.get("delivery");
  
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [pinProtected, setPinProtected] = useState(false);
  const [hasPinProtection, setHasPinProtection] = useState(false);
  
  // Use the secure message data hook
  const {
    loading: dataLoading,
    message: messageData,
    error: dataError,
    hasPinProtection: messagePinProtected
  } = useSecureMessageData({ messageId, recipientEmail });
  
  const {
    pinError,
    verifyingPin,
    verifyPin
  } = usePinVerification({ messageId, recipientEmail });
  
  // Sync state from the hooks
  useEffect(() => {
    setLoading(dataLoading);
    setMessage(messageData);
    setError(dataError);
    setHasPinProtection(messagePinProtected);
    setPinProtected(messagePinProtected);
  }, [dataLoading, messageData, dataError, messagePinProtected]);

  // Loading state
  if (loading) {
    return <MessageLoader />;
  }

  // Error state
  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        technicalDetails={null} 
        onRetry={() => window.location.reload()} 
      />
    );
  }

  // PIN protected message
  if (pinProtected) {
    return (
      <PinProtectedMessage
        pinError={pinError}
        verifyingPin={verifyingPin}
        onVerifyPin={(e, pin) => {
          e.preventDefault();
          verifyPin(e, pin);
          if (!pinError) setPinProtected(false);
        }}
      />
    );
  }

  // Display the message
  return <MessageContent 
    message={message}
    deliveryId={deliveryId}
    recipientEmail={recipientEmail}
  />;
}
