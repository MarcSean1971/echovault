
import { useAccessVerification } from './message-access/useAccessVerification';
import { useSecurityConstraints } from './message-access/useSecurityConstraints';
import { Message } from '@/types/message';

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
  // First verify access and get data
  const {
    isLoading,
    error,
    deliveryData,
    conditionData
  } = useAccessVerification({
    messageId,
    deliveryId,
    recipientEmail
  });

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
