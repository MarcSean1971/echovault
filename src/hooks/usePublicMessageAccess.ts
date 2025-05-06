
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
  // Track if enough time has passed to show error messages - reduced from 4s to 1s
  const [errorDelay, setErrorDelay] = useState(true);
  // Track if we're in a fallback loading state
  const [fallbackLoading, setFallbackLoading] = useState(false);
  
  // Set up a timer to determine when we can show error states - reduced from 4s to 1s
  useEffect(() => {
    const timer = setTimeout(() => {
      setErrorDelay(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  
  // First verify access and get data
  const {
    isLoading: accessLoading,
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
    isLoading: securityLoading,
    verifyPin,
    handleUnlockExpired
  } = useSecurityConstraints({
    messageId,
    conditionData,
    deliveryData,
    isLoading: accessLoading,
    error
  });

  // Combined loading state to prevent UI flashing
  const isLoading = accessLoading || securityLoading || fallbackLoading;

  // Set fallback loading when access methods change to prevent UI flashing
  useEffect(() => {
    if (accessError && !errorDelay) {
      // If we have an error but it's not showing yet, maintain loading state
      setFallbackLoading(true);
      const timer = setTimeout(() => {
        setFallbackLoading(false);
      }, 500); // Reduced from 1s to 500ms to be more responsive
      return () => clearTimeout(timer);
    }
  }, [accessError, errorDelay]);

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
