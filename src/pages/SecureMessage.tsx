
import { useSearchParams } from "react-router-dom";
import { MessageLoader } from "@/components/secure-message/MessageLoader";
import { ErrorDisplay } from "@/components/secure-message/ErrorDisplay";
import { PinProtectedMessage } from "@/components/secure-message/PinProtectedMessage";
import { MessageContent } from "@/components/secure-message/MessageContent";
import { useSecureMessageData } from "@/hooks/useSecureMessageData";
import { usePinVerification } from "@/hooks/usePinVerification";
import { useState, useEffect } from "react";
import { useSecureMessage } from "@/hooks/useSecureMessage";
import { toast } from "@/components/ui/use-toast";

export default function SecureMessage() {
  const [searchParams] = useSearchParams();
  const messageId = searchParams.get("id");
  const recipientEmail = searchParams.get("recipient");
  const deliveryId = searchParams.get("delivery");
  
  console.log("[SecureMessage] URL parameters:", { messageId, recipientEmail, deliveryId });
  
  // Show error toast if missing critical parameters
  useEffect(() => {
    if (!messageId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Missing message ID in URL parameters"
      });
    }
    if (!deliveryId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Missing delivery ID in URL parameters"
      });
    }
  }, [messageId, deliveryId]);
  
  // Use the secure message hook that handles rendering content from API
  const {
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
  } = useSecureMessage({ messageId, recipient: recipientEmail, deliveryId });

  // Loading state
  if (loading) {
    return <MessageLoader />;
  }

  // Error state
  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        technicalDetails={technicalDetails} 
        onRetry={handleRetry} 
      />
    );
  }

  // PIN protected message
  if (pinProtected) {
    return (
      <PinProtectedMessage
        pinError={verifyError}
        verifyingPin={verifying}
        onVerifyPin={(e, pin) => {
          e.preventDefault();
          verifyPin(pin);
        }}
      />
    );
  }

  // Display the message
  return <MessageContent 
    message={htmlContent}
    deliveryId={deliveryId}
    recipientEmail={recipientEmail}
    handleIframeMessage={handleIframeMessage}
  />;
}
