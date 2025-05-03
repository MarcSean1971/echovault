
import { useSearchParams } from "react-router-dom";
import { useSecureMessage } from "@/hooks/useSecureMessage";
import { MessageLoader } from "@/components/secure-message/MessageLoader";
import { ErrorDisplay } from "@/components/secure-message/ErrorDisplay";
import { MessageViewer } from "@/components/secure-message/MessageViewer";

export default function SecureMessage() {
  const [searchParams] = useSearchParams();
  const messageId = searchParams.get("id");
  const recipient = searchParams.get("recipient");
  const deliveryId = searchParams.get("delivery");
  
  // Use the custom hook to handle all secure message functionality
  const {
    loading,
    error,
    technicalDetails,
    htmlContent,
    pinProtected,
    verifyError,
    handleIframeMessage,
    handleRetry
  } = useSecureMessage({
    messageId,
    recipient,
    deliveryId
  });
  
  if (loading) {
    return <MessageLoader />;
  }
  
  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        technicalDetails={technicalDetails} 
        onRetry={handleRetry} 
      />
    );
  }
  
  // Render iframe with message content
  return (
    <div className="container mx-auto px-4 py-8">
      <MessageViewer
        htmlContent={htmlContent}
        pinProtected={pinProtected}
        verifyError={verifyError}
        handleIframeMessage={handleIframeMessage}
      />
    </div>
  );
}
