
import { useState, useEffect } from 'react';
import { useHoverEffects } from '@/hooks/useHoverEffects';
import { Message } from '@/types/message';

interface SecurityConstraint {
  type: 'password' | 'otp' | 'biometric';
  isVerified: boolean;
}

interface SecurityConstraintsProps {
  messageId?: string;
  conditionData: any;
  deliveryData: any;
  isLoading: boolean;
  error: any;
  isPreviewMode?: boolean;
}

export function useSecurityConstraints({
  messageId,
  conditionData,
  deliveryData,
  isLoading: accessLoading,
  error: accessError,
  isPreviewMode = false
}: SecurityConstraintsProps) {
  const [constraints, setConstraints] = useState<SecurityConstraint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPinRequired, setIsPinRequired] = useState(false);
  const [isUnlockDelayed, setIsUnlockDelayed] = useState(false);
  const [unlockTime, setUnlockTime] = useState<Date | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  
  const { applyHoverEffect } = useHoverEffects();

  // Load security constraints for a message
  useEffect(() => {
    const loadSecurityConstraints = async () => {
      if (!messageId || accessLoading || accessError) return;
      
      setIsLoading(true);
      try {
        // Simulate API call to get security constraints
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Example constraints and settings based on condition data
        if (conditionData && !isPreviewMode) {
          const needsPin = conditionData.pin_required || false;
          setIsPinRequired(needsPin);
          
          const delayTime = conditionData.unlock_delay_minutes || 0;
          if (delayTime > 0) {
            setIsUnlockDelayed(true);
            const futureTime = new Date();
            futureTime.setMinutes(futureTime.getMinutes() + delayTime);
            setUnlockTime(futureTime);
          }
          
          // Load message data if verified
          if (!needsPin || (needsPin && isVerified)) {
            // Simulate loading the message with all required fields
            setMessage({
              id: messageId,
              user_id: "test-user", // Required field
              title: "Test Message",
              content: "This is a test message content",
              message_type: "text", // Required field
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              sender_name: "Test User",
              expires_at: null,
              attachments: [], // Required field
              share_location: false,
              text_content: "This is a test message content"
            });
          }
        } else if (isPreviewMode) {
          // In preview mode, load a sample message with all required fields
          setMessage({
            id: messageId,
            user_id: "preview-user", // Required field
            title: "Preview Message",
            content: "This is a preview message content",
            message_type: "text", // Required field
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            sender_name: "Preview User",
            expires_at: null,
            attachments: [], // Required field
            share_location: false,
            text_content: "This is a preview message content"
          });
        }
        
      } catch (error) {
        console.error("Failed to load security constraints:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSecurityConstraints();
  }, [messageId, accessLoading, accessError, conditionData, isVerified, isPreviewMode]);

  // Verify PIN code
  const verifyPin = async (pinCode: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Simulate PIN verification
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // In a real implementation, check the pin against the stored PIN
      const expectedPin = conditionData?.pin_code || "1234";
      const isPinValid = pinCode === expectedPin;
      
      if (isPinValid) {
        setIsVerified(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("PIN verification failed:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle unlock time expired
  const handleUnlockExpired = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsUnlockDelayed(false);
      setUnlockTime(null);
    } catch (error) {
      console.error("Failed to handle unlock expired:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply hover effects
  const setupHoverEffects = () => {
    const selector = 'button, a, .security-control';
    return applyHoverEffect(selector);
  };

  return {
    constraints,
    isLoading,
    isPinRequired,
    isUnlockDelayed,
    unlockTime,
    isVerified,
    message,
    loadConstraints: async () => {},
    setupHoverEffects,
    verifyPin,
    handleUnlockExpired
  };
}
