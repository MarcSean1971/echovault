
import { useState, useEffect } from 'react';
import { Message } from '@/types/message';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface UseSecurityConstraintsProps {
  messageId: string | undefined;
  conditionData: any | null;
  deliveryData: any | null;
  isLoading: boolean;
  error: string | null;
}

interface SecurityConstraintsResult {
  isPinRequired: boolean;
  isUnlockDelayed: boolean;
  unlockTime: Date | null;
  isVerified: boolean;
  message: Message | null;
  verifyPin: (pinCode: string) => Promise<boolean>;
  handleUnlockExpired: () => Promise<void>;
}

export const useSecurityConstraints = ({
  messageId,
  conditionData,
  deliveryData,
  isLoading,
  error
}: UseSecurityConstraintsProps): SecurityConstraintsResult => {
  const [isPinRequired, setIsPinRequired] = useState(false);
  const [isUnlockDelayed, setIsUnlockDelayed] = useState(false);
  const [unlockTime, setUnlockTime] = useState<Date | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    const processSecurityConstraints = async () => {
      if (isLoading || error || !conditionData || !deliveryData) {
        return;
      }
      
      // Check PIN requirement
      if (conditionData?.pin_code) {
        setIsPinRequired(true);
      } else {
        setIsVerified(true);
      }
      
      // Check if unlock delay is required
      if (conditionData?.unlock_delay_hours && conditionData.unlock_delay_hours > 0) {
        // Calculate unlock time based on delivery record creation timestamp
        // Use current time as fallback if delivered_at is not available
        const deliveryTime = deliveryData.delivered_at ? new Date(deliveryData.delivered_at) : new Date();
        const unlockDelayMs = conditionData.unlock_delay_hours * 60 * 60 * 1000;
        const calculatedUnlockTime = new Date(deliveryTime.getTime() + unlockDelayMs);
        
        if (calculatedUnlockTime > new Date()) {
          setIsUnlockDelayed(true);
          setUnlockTime(calculatedUnlockTime);
          setIsVerified(false);
        }
      }

      // Fetch message if no security constraints or if previously viewed
      if ((deliveryData.viewed_count && deliveryData.viewed_count > 0) || 
          (isVerified && !isUnlockDelayed)) {
        const message = await loadMessage(messageId);
        setMessage(message);
      }
      
      // Update view count for valid access
      await updateViewCount(deliveryData);
    };
    
    processSecurityConstraints();
  }, [isLoading, error, conditionData, deliveryData, messageId]);

  // Load message content
  const loadMessage = async (msgId: string | undefined) => {
    if (!msgId) return null;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('id', msgId)
        .single();
        
      if (error) throw error;
      return data as Message;
    } catch (err: any) {
      console.error('Error loading message:', err);
      return null;
    }
  };

  // Update view count
  const updateViewCount = async (deliveryData: any) => {
    if (!deliveryData) return;
    
    try {
      if (!deliveryData.viewed_at) {
        await supabase
          .from('delivered_messages')
          .update({
            viewed_at: new Date().toISOString(),
            viewed_count: (deliveryData.viewed_count || 0) + 1
          })
          .eq('delivery_id', deliveryData.delivery_id);
      } else {
        // Increment view count
        await supabase
          .from('delivered_messages')
          .update({
            viewed_count: (deliveryData.viewed_count || 0) + 1
          })
          .eq('delivery_id', deliveryData.delivery_id);
      }
    } catch (err) {
      console.error('Error updating view count:', err);
    }
  };
  
  // Handle PIN verification
  const verifyPin = async (pinCode: string): Promise<boolean> => {
    if (!messageId || !conditionData) return false;
    
    try {
      if (conditionData.pin_code === pinCode) {
        const message = await loadMessage(messageId);
        setMessage(message);
        setIsVerified(true);
        return true;
      } else {
        toast({
          title: "Invalid PIN code",
          description: "The PIN code you entered is incorrect.",
          variant: "destructive"
        });
        return false;
      }
    } catch (err: any) {
      console.error('Error verifying PIN:', err);
      toast({
        title: "Error",
        description: "Failed to verify PIN code.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Handle unlock delay expiration
  const handleUnlockExpired = async (): Promise<void> => {
    if (!messageId) return;
    
    const message = await loadMessage(messageId);
    setMessage(message);
    setIsUnlockDelayed(false);
    setIsVerified(true);
  };

  return {
    isPinRequired,
    isUnlockDelayed,
    unlockTime,
    isVerified,
    message,
    verifyPin,
    handleUnlockExpired
  };
};
