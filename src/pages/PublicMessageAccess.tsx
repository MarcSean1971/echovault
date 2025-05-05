
import { useParams, useSearchParams } from 'react-router-dom';
import { usePublicMessageAccess } from '@/hooks/usePublicMessageAccess';
import { LoadingState } from '@/components/message/public-access/LoadingState';
import { ErrorState } from '@/components/message/public-access/ErrorState';
import { PinEntry } from '@/components/message/public-access/PinEntry';
import { DelayedUnlock } from '@/components/message/public-access/DelayedUnlock';
import { MessageDisplay } from '@/components/message/public-access/MessageDisplay';

export default function PublicMessageAccess() {
  const { id: messageId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const deliveryId = searchParams.get('delivery');
  const recipientEmail = searchParams.get('recipient');
  
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
  } = usePublicMessageAccess({ messageId, deliveryId, recipientEmail });
  
  // Handle PIN submission
  const handlePinSubmit = async (pinCode: string) => {
    await verifyPin(pinCode);
  };
  
  // Render loading state
  if (isLoading) {
    return <LoadingState />;
  }
  
  // Render error state
  if (error) {
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
  
  // Render message content
  return <MessageDisplay message={message} />;
}
