
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
  // Control UI states
  const [initialLoadState, setInitialLoadState] = useState<'loading' | 'complete' | 'error'>('loading');
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
  
  // Properly decode parameters before passing to hook
  const decodedEmail = recipientEmail ? decodeURIComponent(recipientEmail) : null;
  const decodedDeliveryId = deliveryId ? decodeURIComponent(deliveryId) : null;
  
  // Request access to the message
  const { 
    isPinRequired, 
    isUnlockDelayed, 
    unlockTime, 
    isVerified, 
    message, 
    isLoading,
    verifyPin,
    handleUnlockExpired,
    fetchMessage,
    error
  } = usePublicMessageAccess();
  
  // Set up a timing system for smooth UI transitions
  useEffect(() => {
    // Initial loading state - show loading animation for at least 1 second
    // This prevents UI flashing
    const loadTimer = setTimeout(() => {
      setInitialLoadState(error ? 'error' : 'complete');
    }, 1000);
    
    return () => clearTimeout(loadTimer);
  }, [message, error, isLoading]);
  
  // Handle PIN submission
  const handlePinSubmit = async (pinCode: string) => {
    await verifyPin(pinCode);
  };
  
  // For preview mode with debug, try to fetch the message directly
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
            
          if (data) {
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
  if ((isLoading || initialLoadState === 'loading') && !error) {
    return <LoadingState />;
  }
  
  // For preview mode with debug enabled, show the message directly if available
  if (isPreviewMode && isDebugMode && previewMessage) {
    return <MessageDisplay message={previewMessage} isPreviewMode={true} />;
  }
  
  // Show specific error state
  if (error && initialLoadState !== 'loading') {
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
  
  // Show not found state when appropriate - only after loading is complete
  if (!message && initialLoadState === 'complete' && !isLoading) {
    return <MessageNotFound />;
  }
  
  // Render message content when everything is ready
  return <MessageDisplay 
    message={message} 
    isPreviewMode={isPreviewMode}
  />;
}
