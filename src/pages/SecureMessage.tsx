
import { useSearchParams } from "react-router-dom";
import { MessageLoader } from "@/components/secure-message/MessageLoader";
import { ErrorDisplay } from "@/components/secure-message/ErrorDisplay";
import { PinProtectedMessage } from "@/components/secure-message/PinProtectedMessage";
import { MessageContent } from "@/components/secure-message/MessageContent";
import { useSecureMessageAccess } from "@/hooks/useSecureMessageAccess";

export default function SecureMessage() {
  const [searchParams] = useSearchParams();
  const messageId = searchParams.get("id");
  const recipientEmail = searchParams.get("recipient");
  
  const {
    loading,
    message,
    error,
    pinProtected,
    pinError,
    verifyingPin,
    verifyPin
  } = useSecureMessageAccess({ messageId, recipientEmail });

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
        onVerifyPin={verifyPin}
      />
    );
  }

  // Display the message
  return <MessageContent message={message} />;
}
