
import { useState, useEffect } from 'react';
import { useHoverEffects } from '@/hooks/useHoverEffects';
import { Message } from '@/types/message';

export interface AccessVerificationProps {
  messageId?: string;
  deliveryId: string | null;
  recipientEmail: string | null;
  isPreviewMode?: boolean;
}

export interface AccessVerificationResult {
  isVerified: boolean;
  isLoading: boolean;
  error: string | null;
  deliveryData: any;
  conditionData: any;
  verifyAccess: () => Promise<boolean>;
}

export function useAccessVerification({
  messageId,
  deliveryId,
  recipientEmail,
  isPreviewMode = false
}: AccessVerificationProps): AccessVerificationResult {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deliveryData, setDeliveryData] = useState<any>(null);
  const [conditionData, setConditionData] = useState<any>(null);
  const { applyHoverEffect } = useHoverEffects();

  // Perform initial verification on mount
  useEffect(() => {
    const initVerification = async () => {
      try {
        // For preview mode, simulate success without actual verification
        if (isPreviewMode) {
          setIsVerified(true);
          setDeliveryData({ is_preview: true });
          setConditionData({ is_preview: true });
          setIsLoading(false);
          return;
        }
        
        // Simulate verification process
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (!messageId) {
          setError("Message ID is required");
        } else if (!deliveryId) {
          setError("Delivery ID is required");
        } else {
          setIsVerified(true);
          setDeliveryData({ id: deliveryId, verified: true });
          setConditionData({ message_id: messageId });
        }
      } catch (err: any) {
        console.error("Access verification failed:", err);
        setError(err.message || "Failed to verify access");
      } finally {
        setIsLoading(false);
      }
    };
    
    initVerification();
  }, [messageId, deliveryId, recipientEmail, isPreviewMode]);

  // Manual verification method
  const verifyAccess = async () => {
    if (!messageId) return false;
    
    setIsLoading(true);
    try {
      // Add actual verification logic here
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsVerified(true);
      return true;
    } catch (err: any) {
      console.error("Access verification failed:", err);
      setError(err.message || "Failed to verify access");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Apply hover effects to elements when mounted
  useEffect(() => {
    const selector = 'button, a, .clickable-icon';
    return applyHoverEffect(selector);
  }, [applyHoverEffect]);

  return {
    isVerified,
    isLoading,
    error,
    deliveryData,
    conditionData,
    verifyAccess
  };
}
