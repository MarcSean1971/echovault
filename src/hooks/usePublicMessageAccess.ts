
import { useAccessVerification } from './message-access/useAccessVerification';
import { useSecurityConstraints } from './message-access/useSecurityConstraints';
import { Message } from '@/types/message';
import { useState, useEffect } from 'react';

interface UsePublicMessageAccessProps {
  messageId: string | undefined;
  deliveryId: string | null;
  recipientEmail: string | null;
}

interface PublicMessageAccessResult {
  message: Message | null;
  isLoading: boolean;
  error: string | null;
  isPinRequired: boolean;
  isUnlockDelayed: boolean;
  unlockTime: Date | null;
  isVerified: boolean;
  verifyPin: (pinCode: string) => Promise<boolean>;
  handleUnlockExpired: () => Promise<void>;
}

export const usePublicMessageAccess = ({ 
  messageId, 
  deliveryId, 
  recipientEmail 
}: UsePublicMessageAccessProps): PublicMessageAccessResult => {
  // Track if enough time has passed to show error messages
  const [errorDelay, setErrorDelay] = useState(true);
  
  // Set up a timer to determine when we can show error states
  useEffect(() => {
    const timer = setTimeout(() => {
      setErrorDelay(false);
    }, 3500); // Increased to 3.5 seconds for more reliable error delay
    return () => clearTimeout(timer);
  }, []);
  
  // First verify access and get data
  const {
    isLoading,
    error: accessError,
    deliveryData,
    conditionData
  } = useAccessVerification({
    messageId,
    deliveryId,
    recipientEmail
  });

  // Only show errors after the delay period
  const error = errorDelay ? null : accessError;

  // Then handle security constraints
  const {
    isPinRequired,
    isUnlockDelayed,
    unlockTime,
    isVerified,
    message,
    verifyPin,
    handleUnlockExpired
  } = useSecurityConstraints({
    messageId,
    conditionData,
    deliveryData,
    isLoading,
    error
  });

  return {
    message,
    isLoading, 
    error,
    isPinRequired,
    isUnlockDelayed,
    unlockTime,
    isVerified,
    verifyPin,
    handleUnlockExpired
  };
};
