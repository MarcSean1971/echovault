import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Message } from '@/types/message';
import { toast } from "@/components/ui/use-toast";

interface UseSecurityConstraintsProps {
  messageId: string | undefined;
  conditionData: any | null;
  deliveryData: any | null;
  isLoading: boolean;
  error: string | null;
  isPreviewMode?: boolean;
}

interface SecurityConstraintsResult {
  isPinRequired: boolean;
  isUnlockDelayed: boolean;
  unlockTime: Date | null;
  isVerified: boolean;
  message: Message | null;
  isLoading: boolean;
  verifyPin: (pinCode: string) => Promise<boolean>;
  handleUnlockExpired: () => Promise<void>;
}

export const useSecurityConstraints = ({
  messageId,
  conditionData,
  deliveryData,
  isLoading: accessLoading,
  error,
  isPreviewMode = false
}: UseSecurityConstraintsProps): SecurityConstraintsResult => {
  const [isPinRequired, setIsPinRequired] = useState(false);
  const [isUnlockDelayed, setIsUnlockDelayed] = useState(false);
  const [unlockTime, setUnlockTime] = useState<Date | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the message content when verification is successful or in preview mode
  useEffect(() => {
    const fetchMessage = async () => {
      // Don't fetch if there's an error, we're still loading access verification data, 
      // or we don't have a message ID
      if (error || accessLoading || !messageId) {
        setIsLoading(false);
        return;
      }
      
      // In preview mode, bypass the security checks
      if (isPreviewMode) {
        console.log("Preview mode: bypassing security constraints");
        setIsPinRequired(false);
        setIsUnlockDelayed(false);
        setIsVerified(true);
        
        try {
          // Fetch the message directly
          const { data: messageData, error: messageError } = await supabase
            .from('messages')
            .select('*')
            .eq('id', messageId)
            .single();
            
          if (messageError) {
            console.error("Error fetching message in preview mode:", messageError);
            setIsLoading(false);
            return;
          }
          
          if (!messageData) {
            console.error("No message found with ID:", messageId);
            setIsLoading(false);
            return;
          }
          
          console.log("Message loaded in preview mode:", messageData);
          setMessage(messageData as unknown as Message);
          setIsLoading(false);
          return;
        } catch (err) {
          console.error("Error in preview mode message fetch:", err);
          setIsLoading(false);
          return;
        }
      }
      
      // Handle security constraints based on condition data
      if (conditionData) {
        // Check if a PIN code is required
        if (conditionData.pin_code) {
          console.log("PIN code required for message access");
          setIsPinRequired(true);
        }
        
        // Check if there's an unlock delay
        if (conditionData.unlock_delay_hours && conditionData.unlock_delay_hours > 0) {
          console.log(`Unlock delay of ${conditionData.unlock_delay_hours} hours required`);
          setIsUnlockDelayed(true);
          
          // Calculate the unlock time
          if (deliveryData && deliveryData.delivered_at) {
            const deliveredAt = new Date(deliveryData.delivered_at);
            const delayMilliseconds = conditionData.unlock_delay_hours * 60 * 60 * 1000;
            const unlockTimeValue = new Date(deliveredAt.getTime() + delayMilliseconds);
            console.log(`Unlock time: ${unlockTimeValue.toISOString()}`);
            setUnlockTime(unlockTimeValue);
            
            // Check if the unlock time has passed
            const now = new Date();
            if (now >= unlockTimeValue) {
              console.log("Unlock time has already passed");
              setIsUnlockDelayed(false);
            }
          }
        }
      } else {
        console.log("No security constraints - direct access allowed");
      }
      
      // If no security constraints or they're satisfied, fetch the message
      if ((!isPinRequired && !isUnlockDelayed) || isVerified) {
        try {
          console.log("Fetching message content...");
          
          // If we have an edge function result with the message, use that
          if (deliveryData && deliveryData._message) {
            console.log("Using message from edge function result");
            setMessage(deliveryData._message as Message);
            setIsLoading(false);
            return;
          }
          
          // Otherwise fetch from the database
          const { data: messageData, error: messageError } = await supabase
            .from('messages')
            .select('*')
            .eq('id', messageId)
            .single();
            
          if (messageError) {
            console.error("Error fetching message:", messageError);
            setIsLoading(false);
            return;
          }
          
          if (!messageData) {
            console.error("No message found with ID:", messageId);
            setIsLoading(false);
            return;
          }
          
          console.log("Message loaded:", messageData);
          setMessage(messageData as unknown as Message);
        } catch (err) {
          console.error("Error fetching message:", err);
        } finally {
          setIsLoading(false);
        }
      } else {
        console.log("Security constraints not satisfied yet");
        setIsLoading(false);
      }
    };
    
    fetchMessage();
  }, [messageId, conditionData, deliveryData, error, accessLoading, isPinRequired, isUnlockDelayed, isVerified, isPreviewMode]);
  
  // Function to verify PIN code
  const verifyPin = async (pinCode: string): Promise<boolean> => {
    if (!conditionData || !conditionData.pin_code) {
      console.error("No PIN code configured for verification");
      return false;
    }
    
    // In a real system, we'd hash the pin and compare securely
    // For now, we'll just do a direct comparison
    const isCorrect = pinCode === conditionData.pin_code;
    
    if (isCorrect) {
      console.log("PIN verification successful");
      setIsVerified(true);
      setIsPinRequired(false);
      toast({
        title: "Access granted",
        description: "PIN code verified successfully",
      });
    } else {
      console.log("PIN verification failed");
      toast({
        title: "Access denied",
        description: "Incorrect PIN code",
        variant: "destructive",
      });
    }
    
    return isCorrect;
  };
  
  // Function to handle expired unlock delay
  const handleUnlockExpired = async (): Promise<void> => {
    console.log("Unlock delay has expired");
    setIsUnlockDelayed(false);
    setIsVerified(true);
  };

  return {
    isPinRequired,
    isUnlockDelayed,
    unlockTime,
    isVerified,
    message,
    isLoading,
    verifyPin,
    handleUnlockExpired
  };
};
