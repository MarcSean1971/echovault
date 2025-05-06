
import { useParams, useSearchParams } from 'react-router-dom';
import { usePublicMessageAccess } from '@/hooks/usePublicMessageAccess';
import { LoadingState } from '@/components/message/public-access/LoadingState';
import { ErrorState } from '@/components/message/public-access/ErrorState';
import { PinEntry } from '@/components/message/public-access/PinEntry';
import { DelayedUnlock } from '@/components/message/public-access/DelayedUnlock';
import { MessageDisplay } from '@/components/message/public-access/MessageDisplay';
import { useEffect, useState } from 'react';
import { MessageNotFound } from '@/components/message/detail/MessageNotFound';

export default function PublicMessageAccess() {
  // Track if we're in the initial loading phase
  const [initialLoading, setInitialLoading] = useState(true);
  // Extended loading time for a smoother experience
  const [extendedLoading, setExtendedLoading] = useState(true);
  // Track if enough time has passed to show error messages
  const [canShowError, setCanShowError] = useState(false);
  
  // Get message ID from URL path parameter
  const { id: messageId } = useParams<{ id: string }>();
  
  // Get delivery ID and recipient email from query parameters
  const [searchParams] = useSearchParams();
  const deliveryId = searchParams.get('delivery');
  const recipientEmail = searchParams.get('recipient');
  
  // Set up a more robust timing system for UI states
  useEffect(() => {
    // Initial quick loading check
    const initialTimer = setTimeout(() => {
      setInitialLoading(false);
    }, 2000); // 2 seconds for initial loading
    
    // Extended loading phase to prevent flickering between states
    const extendedTimer = setTimeout(() => {
      setExtendedLoading(false);
    }, 3500); // 3.5 seconds for extended loading
    
    // Error display phase - only show errors after this time
    const errorTimer = setTimeout(() => {
      setCanShowError(true);
    }, 4000); // 4 seconds before showing errors
    
    return () => {
      clearTimeout(initialTimer);
      clearTimeout(extendedTimer);
      clearTimeout(errorTimer);
    };
  }, []);
  
  // For debugging purposes - log the parameters
  useEffect(() => {
    console.log("==== PublicMessageAccess.tsx ====");
    console.log("Path parameters:");
    console.log("messageId:", messageId);
    console.log("Query parameters (raw):");
    console.log("deliveryId (raw):", deliveryId);
    console.log("recipientEmail (raw):", recipientEmail);

    // Properly decode parameters to ensure correct comparison
    const decodedEmail = recipientEmail ? decodeURIComponent(recipientEmail) : null;
    const decodedDeliveryId = deliveryId ? decodeURIComponent(deliveryId) : null;
    
    console.log("Decoded parameters:");
    console.log("decodedDeliveryId:", decodedDeliveryId);
    console.log("decodedEmail:", decodedEmail);
    console.log("Current URL:", window.location.href);
    
    // Validate the parameters
    if (!messageId || !deliveryId || !recipientEmail) {
      console.error("Missing required parameters for message access!");
      const missingParams = [];
      if (!messageId) missingParams.push("messageId");
      if (!deliveryId) missingParams.push("deliveryId");
      if (!recipientEmail) missingParams.push("recipientEmail");
      console.error(`Missing parameters: ${missingParams.join(', ')}`);
    }
  }, [messageId, deliveryId, recipientEmail]);
  
  // Properly decode parameters before passing to hook
  const decodedEmail = recipientEmail ? decodeURIComponent(recipientEmail) : null;
  const decodedDeliveryId = deliveryId ? decodeURIComponent(deliveryId) : null;
  
  const { 
    message,
    isLoading,
    error,
    isPinRequired,
    isUnlockDelayed,
    unlockTime,
    isVerified,
    verifyPin,
    handleUnlockExpired
  } = usePublicMessageAccess({ 
    messageId, 
    deliveryId: decodedDeliveryId, 
    recipientEmail: decodedEmail
  });
  
  // Handle PIN submission
  const handlePinSubmit = async (pinCode: string) => {
    await verifyPin(pinCode);
  };
  
  // Render loading state during any loading phase
  if (isLoading || initialLoading || extendedLoading) {
    return <LoadingState />;
  }
  
  // Only show error state if we're allowed to show errors and there is an error
  if (error && canShowError) {
    return <ErrorState error={error} />;
  }
  
  // Render PIN entry form
  if (isPinRequired && !isVerified) {
    return <PinEntry onSubmit={handlePinSubmit} />;
  }
  
  // Render delayed unlock message
  if (isUnlockDelayed && unlockTime) {
    return <DelayedUnlock unlockTime={unlockTime} onUnlock={handleUnlockExpired} />;
  }
  
  // We're explicitly not showing MessageNotFound until we're sure we're not loading
  // and enough time has passed to show errors
  if (!message && canShowError && !initialLoading && !extendedLoading && !isLoading) {
    return <MessageNotFound isInitialLoading={false} />;
  }
  
  // If message is null but we're still in the grace period before showing errors,
  // continue showing loading state to prevent UI flashing
  if (!message) {
    return <LoadingState />;
  }
  
  // Render message content
  return <MessageDisplay message={message} isInitialLoading={initialLoading || extendedLoading} />;
}
