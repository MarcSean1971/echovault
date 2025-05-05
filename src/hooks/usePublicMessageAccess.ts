
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/types/message";
import { toast } from "@/components/ui/use-toast";

interface UsePublicMessageAccessProps {
  messageId: string | undefined;
  deliveryId: string | null;
  recipientEmail: string | null;
}

interface PublicMessageAccessState {
  message: Message | null;
  isLoading: boolean;
  error: string | null;
  isPinRequired: boolean;
  isUnlockDelayed: boolean;
  unlockTime: Date | null;
  isVerified: boolean;
}

export const usePublicMessageAccess = ({ 
  messageId, 
  deliveryId, 
  recipientEmail 
}: UsePublicMessageAccessProps) => {
  const [state, setState] = useState<PublicMessageAccessState>({
    message: null,
    isLoading: true,
    error: null,
    isPinRequired: false,
    isUnlockDelayed: false,
    unlockTime: null,
    isVerified: false,
  });

  // Verify access and load message
  useEffect(() => {
    const verifyAccess = async () => {
      if (!messageId || !deliveryId || !recipientEmail) {
        setState(prev => ({
          ...prev,
          error: 'Invalid access link. Please check your email for the correct link.',
          isLoading: false
        }));
        return;
      }
      
      try {
        // First, verify the delivery record
        const { data: deliveryData, error: deliveryError } = await supabase
          .from('delivered_messages')
          .select(`
            id, 
            message_id, 
            recipient_id, 
            delivery_id,
            viewed_at,
            viewed_count,
            condition_id,
            delivered_at
          `)
          .eq('delivery_id', deliveryId)
          .eq('message_id', messageId)
          .single();
        
        if (deliveryError || !deliveryData) {
          console.error('Error verifying delivery:', deliveryError);
          setState(prev => ({ 
            ...prev,
            error: 'This message link is invalid or has expired.',
            isLoading: false
          }));
          return;
        }
        
        // Verify the recipient email
        const { data: recipientData, error: recipientError } = await supabase
          .from('recipients')
          .select('id, email')
          .eq('id', deliveryData.recipient_id)
          .single();
          
        if (recipientError || !recipientData || recipientData.email !== recipientEmail) {
          console.error('Error verifying recipient:', recipientError);
          setState(prev => ({
            ...prev,
            error: 'Unauthorized access. This message is intended for a different recipient.',
            isLoading: false
          }));
          return;
        }
        
        // Check if there are any security constraints
        const { data: conditionData, error: conditionError } = await supabase
          .from('message_conditions')
          .select('pin_code, unlock_delay_hours')
          .eq('id', deliveryData.condition_id)
          .single();
        
        // Update state based on security constraints
        let pinRequired = false;
        let unlockDelayed = false;
        let calculatedUnlockTime: Date | null = null;
        let isVerified = false;

        if (conditionData?.pin_code) {
          pinRequired = true;
        } else {
          isVerified = true;
        }
        
        // Check if unlock delay is required
        if (conditionData?.unlock_delay_hours && conditionData.unlock_delay_hours > 0) {
          // Calculate unlock time based on delivery record creation timestamp
          // Use current time as fallback if delivered_at is not available
          const deliveryTime = deliveryData.delivered_at ? new Date(deliveryData.delivered_at) : new Date();
          const unlockDelayMs = conditionData.unlock_delay_hours * 60 * 60 * 1000;
          calculatedUnlockTime = new Date(deliveryTime.getTime() + unlockDelayMs);
          
          if (calculatedUnlockTime > new Date()) {
            unlockDelayed = true;
          }
        }

        // Update state with security constraint results
        setState(prev => ({
          ...prev,
          isPinRequired: pinRequired,
          isUnlockDelayed: unlockDelayed,
          unlockTime: calculatedUnlockTime,
          isVerified: isVerified && !unlockDelayed
        }));
        
        // Fetch the message content if no security constraints or if already viewed before
        if ((deliveryData.viewed_count && deliveryData.viewed_count > 0) || 
            (!pinRequired && !unlockDelayed)) {
          const message = await loadMessage(messageId);
          setState(prev => ({
            ...prev,
            message,
          }));
        }
        
        // Update view count if this is a valid access
        await updateViewCount(deliveryData);
      } catch (err: any) {
        console.error('Error verifying access:', err);
        setState(prev => ({
          ...prev,
          error: 'An error occurred while verifying access to this message.',
          isLoading: false
        }));
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };
    
    verifyAccess();
  }, [messageId, deliveryId, recipientEmail]);

  // Load message content
  const loadMessage = async (msgId: string) => {
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
      setState(prev => ({
        ...prev,
        error: 'Unable to load message content.'
      }));
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
  const verifyPin = async (pinCode: string) => {
    if (!messageId) return;
    
    try {
      // Verify PIN against the database
      const { data, error } = await supabase
        .from('message_conditions')
        .select('id, pin_code')
        .eq('message_id', messageId)
        .single();
      
      if (error) throw error;
      
      if (data.pin_code === pinCode) {
        const message = await loadMessage(messageId);
        setState(prev => ({
          ...prev,
          isVerified: true,
          message,
        }));
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
  const handleUnlockExpired = async () => {
    if (!messageId) return;
    
    const message = await loadMessage(messageId);
    setState(prev => ({
      ...prev,
      isUnlockDelayed: false,
      isVerified: true,
      message,
    }));
  };

  return {
    ...state,
    verifyPin,
    handleUnlockExpired,
  };
};
