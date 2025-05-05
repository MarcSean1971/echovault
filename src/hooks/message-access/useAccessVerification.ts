
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface UseAccessVerificationProps {
  messageId: string | undefined;
  deliveryId: string | null;
  recipientEmail: string | null;
}

interface AccessVerificationResult {
  isLoading: boolean;
  error: string | null;
  deliveryData: any | null;
  recipientData: any | null;
  conditionData: any | null;
}

export const useAccessVerification = ({
  messageId,
  deliveryId,
  recipientEmail
}: UseAccessVerificationProps): AccessVerificationResult => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deliveryData, setDeliveryData] = useState<any | null>(null);
  const [recipientData, setRecipientData] = useState<any | null>(null);
  const [conditionData, setConditionData] = useState<any | null>(null);

  useEffect(() => {
    const verifyAccess = async () => {
      if (!messageId || !deliveryId || !recipientEmail) {
        console.error('Missing required parameters:', { messageId, deliveryId, recipientEmail });
        setError('Invalid access link. Please check your email for the correct link.');
        setIsLoading(false);
        return;
      }
      
      try {
        console.log(`Verifying access for message: ${messageId}, delivery: ${deliveryId}, recipient: ${recipientEmail}`);
        
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
          setError('This message link is invalid or has expired.');
          setIsLoading(false);
          return;
        }
        
        console.log('Delivery data found:', deliveryData);
        setDeliveryData(deliveryData);
        
        // Verify the recipient email
        const { data: recipientData, error: recipientError } = await supabase
          .from('recipients')
          .select('id, email')
          .eq('id', deliveryData.recipient_id)
          .single();
          
        if (recipientError || !recipientData || recipientData.email !== recipientEmail) {
          console.error('Error verifying recipient:', recipientError);
          console.error('Recipient match check:', recipientData?.email, recipientEmail);
          setError('Unauthorized access. This message is intended for a different recipient.');
          setIsLoading(false);
          return;
        }
        
        console.log('Recipient verified:', recipientData);
        setRecipientData(recipientData);
        
        // Check if there are any security constraints
        const { data: conditionData, error: conditionError } = await supabase
          .from('message_conditions')
          .select('pin_code, unlock_delay_hours')
          .eq('id', deliveryData.condition_id)
          .single();
        
        if (conditionError) {
          console.error('Error fetching message conditions:', conditionError);
          setError('Unable to verify message access conditions.');
          setIsLoading(false);
          return;
        }
        
        console.log('Security conditions retrieved:', conditionData);
        setConditionData(conditionData);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Error verifying access:', err);
        setError('An error occurred while verifying access to this message.');
        setIsLoading(false);
      }
    };
    
    verifyAccess();
  }, [messageId, deliveryId, recipientEmail]);

  return {
    isLoading,
    error,
    deliveryData,
    recipientData,
    conditionData
  };
};
