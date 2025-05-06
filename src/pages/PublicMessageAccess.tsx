
import { useParams, useSearchParams } from 'react-router-dom';
import { usePublicMessageAccess } from '@/hooks/usePublicMessageAccess';
import { LoadingState } from '@/components/message/public-access/LoadingState';
import { ErrorState } from '@/components/message/public-access/ErrorState';
import { PinEntry } from '@/components/message/public-access/PinEntry';
import { DelayedUnlock } from '@/components/message/public-access/DelayedUnlock';
import { MessageDisplay } from '@/components/message/public-access/MessageDisplay';
import { useEffect, useState } from 'react';
import { MessageNotFound } from '@/components/message/detail/MessageNotFound';
import { supabase } from "@/integrations/supabase/client";

export default function PublicMessageAccess() {
  // Track if we're in the initial loading phase
  const [initialLoading, setInitialLoading] = useState(true);
  // Track if enough time has passed to show error messages
  const [canShowError, setCanShowError] = useState(false);
  // Track if this is a preview mode access
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // Get message ID from URL path parameter
  const { id: messageId } = useParams<{ id: string }>();
  
  // Get delivery ID and recipient email from query parameters
  const [searchParams] = useSearchParams();
  const deliveryId = searchParams.get('delivery');
  const recipientEmail = searchParams.get('recipient');
  const isDebugMode = searchParams.get('debug') === 'true';
  
  // Check if this is a preview URL
  useEffect(() => {
    const previewParam = searchParams.get('preview') === 'true';
    const isTestDelivery = deliveryId?.startsWith('preview-') || deliveryId?.startsWith('test-');
    setIsPreviewMode(previewParam || isTestDelivery);
  }, [deliveryId, searchParams]);
  
  // Set up a more efficient timing system for UI states
  useEffect(() => {
    // Initial loading check
    const initialTimer = setTimeout(() => {
      setInitialLoading(false);
    }, 1000);
    
    // Error display phase
    const errorTimer = setTimeout(() => {
      setCanShowError(true);
    }, 1000);
    
    return () => {
      clearTimeout(initialTimer);
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
    console.log("isDebugMode:", isDebugMode);
    console.log("isPreviewMode:", isPreviewMode);

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
    
    // If it's a preview mode, log that
    if (isPreviewMode) {
      console.log("PREVIEW MODE DETECTED: This is a test/preview access");
    }
  }, [messageId, deliveryId, recipientEmail, isDebugMode, isPreviewMode]);
  
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
    recipientEmail: decodedEmail,
    isPreviewMode // Pass preview mode to hook
  });
  
  // Handle PIN submission
  const handlePinSubmit = async (pinCode: string) => {
    await verifyPin(pinCode);
  };
  
  // If we're in preview mode and there's a message ID, try to fetch the message directly
  const [previewMessage, setPreviewMessage] = useState<any>(null);
  
  useEffect(() => {
    const fetchPreviewMessage = async () => {
      if (isPreviewMode && messageId && isDebugMode) {
        try {
          const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('id', messageId)
            .single();
            
          if (error) {
            console.error("Error fetching preview message:", error);
          } else if (data) {
            console.log("Preview message data fetched directly:", data);
            setPreviewMessage(data);
          }
        } catch (err) {
          console.error("Error in preview mode fetch:", err);
        }
      }
    };
    
    fetchPreviewMessage();
  }, [isPreviewMode, messageId, isDebugMode]);
  
  // Render loading state during initial loading phase
  if (isLoading || initialLoading) {
    return <LoadingState />;
  }
  
  // For preview mode with debug enabled, show the message directly if available
  if (isPreviewMode && isDebugMode && previewMessage) {
    return <MessageDisplay message={previewMessage} isInitialLoading={false} isPreviewMode={true} />;
  }
  
  // Only show error state if we're allowed to show errors and there is an error
  if (error && canShowError) {
    return <ErrorState error={error} isPreviewMode={isPreviewMode} />;
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
  if (!message && canShowError && !initialLoading && !isLoading) {
    return <MessageNotFound isInitialLoading={false} />;
  }
  
  // If message is null but we're still in the grace period before showing errors,
  // continue showing loading state to prevent UI flashing
  if (!message) {
    return <LoadingState />;
  }
  
  // Render message content
  return <MessageDisplay 
    message={message} 
    isInitialLoading={initialLoading}
    isPreviewMode={isPreviewMode}
  />;
}
