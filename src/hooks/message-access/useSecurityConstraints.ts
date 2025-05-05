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
  
  // Load message content once verified
  useEffect(() => {
    const loadMessage = async () => {
      if (!messageId || isLoading || error || !deliveryData) {
        return;
      }

      try {
        // If we have the message from the edge function response, we can use that
        if (deliveryData.message) {
          console.log("Using message from edge function response");
          // Transform the message to ensure it conforms to our expected Message type
          const transformedMessage: Message = {
            ...deliveryData.message,
            attachments: Array.isArray(deliveryData.message.attachments)
              ? deliveryData.message.attachments.map((att: any) => ({
                  path: att.path || '',
                  name: att.name || '',
                  size: att.size || 0,
                  type: att.type || ''
                }))
              : null
          };
          setMessage(transformedMessage);
          setIsVerified(true);
          return;
        }

        // Otherwise fetch the message from the database
        const { data, error: messageError } = await supabase
          .from('messages')
          .select('*')
          .eq('id', messageId)
          .maybeSingle();
          
        if (messageError) {
          console.error("Error loading message:", messageError);
          toast({
            title: "Error",
            description: "Failed to load message content",
            variant: "destructive"
          });
          return;
        }
        
        if (!data) {
          console.error("Message not found");
          return;
        }
        
        // Transform the message to ensure it conforms to our expected Message type
        const transformedMessage: Message = {
          ...data,
          attachments: Array.isArray(data.attachments)
            ? data.attachments.map((att: any) => ({
                path: att.path || '',
                name: att.name || '',
                size: att.size || 0,
                type: att.type || ''
              }))
            : null
        };
        
        setMessage(transformedMessage);
        setIsVerified(true);
        
        // Update view count in the delivered_messages table
        if (deliveryData.id && !deliveryData.viewed_at) {
          await supabase
            .from('delivered_messages')
            .update({
              viewed_at: new Date().toISOString(),
              viewed_count: 1
            })
            .eq('id', deliveryData.id);
        } else if (deliveryData.id) {
          // Increment view count if already viewed
          await supabase
            .from('delivered_messages')
            .update({
              viewed_count: (deliveryData.viewed_count || 0) + 1
            })
            .eq('id', deliveryData.id);
        }
      } catch (e) {
        console.error("Error in loadMessage:", e);
      }
    };
    
    loadMessage();
  }, [messageId, isLoading, error, deliveryData]);
  
  // Check if security constraints apply (PIN, delayed unlock)
  useEffect(() => {
    if (!conditionData) {
      return;
    }
    
    // Check if PIN protection is enabled
    if (conditionData.pin_code) {
      setIsPinRequired(true);
    }
    
    // Check if delayed unlock is enabled
    if (conditionData.unlock_delay_hours && conditionData.unlock_delay_hours > 0) {
      setIsUnlockDelayed(true);
      
      // Check if delivered_at + unlock_delay_hours is in the future
      if (deliveryData && deliveryData.delivered_at) {
        const deliveredAt = new Date(deliveryData.delivered_at);
        const unlockAt = new Date(deliveredAt.getTime() + (conditionData.unlock_delay_hours * 60 * 60 * 1000));
        
        setUnlockTime(unlockAt);
        
        // If unlock time is in the future, don't show content yet
        if (unlockAt > new Date()) {
          setIsVerified(false);
        }
      }
    }
  }, [conditionData, deliveryData]);
  
  // Function to verify PIN code
  const verifyPin = async (enteredPin: string): Promise<boolean> => {
    if (!conditionData || !conditionData.pin_code) {
      return false;
    }
    
    if (enteredPin === conditionData.pin_code) {
      setIsVerified(true);
      toast({
        title: "PIN Accepted",
        description: "Message unlocked successfully"
      });
      return true;
    }
    
    toast({
      title: "Invalid PIN",
      description: "The PIN you entered is incorrect",
      variant: "destructive"
    });
    return false;
  };
  
  // Function to handle when unlock time has expired
  const handleUnlockExpired = async (): Promise<void> => {
    setIsVerified(true);
    toast({
      title: "Message Unlocked",
      description: "The delayed access period has ended"
    });
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
