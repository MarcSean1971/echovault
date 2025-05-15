
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface UseAccessVerificationProps {
  messageId: string | undefined;
  deliveryId: string | null;
  recipientEmail: string | null;
  isPreviewMode?: boolean;
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
  recipientEmail,
  isPreviewMode = false
}: UseAccessVerificationProps): AccessVerificationResult => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deliveryData, setDeliveryData] = useState<any | null>(null);
  const [recipientData, setRecipientData] = useState<any | null>(null);
  const [conditionData, setConditionData] = useState<any | null>(null);

  useEffect(() => {
    const verifyAccess = async () => {
      // Parameter validation
      if (!messageId || !deliveryId || !recipientEmail) {
        const missingParams = [];
        if (!messageId) missingParams.push('messageId');
        if (!deliveryId) missingParams.push('deliveryId');
        if (!recipientEmail) missingParams.push('recipientEmail');
        
        console.error('Missing required parameters:', { 
          messageId: messageId || 'missing', 
          deliveryId: deliveryId || 'missing', 
          recipientEmail: recipientEmail || 'missing',
          isPreviewMode
        });
        
        // For preview mode, show a different error
        if (isPreviewMode) {
          console.log("Preview mode active, not showing error for missing parameters");
          setIsLoading(false);
          return;
        }
        
        setError(`Invalid access link. Missing parameters: ${missingParams.join(', ')}. Please check your email for the correct link.`);
        setIsLoading(false);
        return;
      }
      
      // For preview mode with delivery ID starting with preview- or test-, bypass the normal verification
      const isTestDelivery = deliveryId.startsWith('preview-') || deliveryId.startsWith('test-');
      if (isPreviewMode || isTestDelivery) {
        console.log("Preview mode enabled, bypassing normal access verification");
        
        try {
          // Get message directly for preview mode
          const { data: messageData, error: messageError } = await supabase
            .from('messages')
            .select('*')
            .eq('id', messageId)
            .maybeSingle();
            
          if (messageError) {
            console.error("Preview mode message fetch error:", messageError);
            setError("Could not load preview message: " + messageError.message);
          } else if (!messageData) {
            console.error("No message found in preview mode");
            setError("Message not found in preview mode");
          } else {
            console.log("Preview mode message fetched successfully:", messageData);
            
            // Create synthetic delivery data for preview
            const syntheticDeliveryData = {
              id: `preview-${Date.now()}`,
              message_id: messageId,
              delivery_id: deliveryId,
              recipient_id: "preview-recipient",
              viewed_at: new Date().toISOString(),
              viewed_count: 1,
              delivered_at: new Date().toISOString(),
              created_at: new Date().toISOString()
            };
            
            // Create synthetic recipient data
            const syntheticRecipientData = {
              id: "preview-recipient",
              email: recipientEmail,
              name: "Preview User"
            };
            
            // Create synthetic condition data
            const syntheticConditionData = {
              id: `preview-${Date.now()}`,
              pin_code: null,
              unlock_delay_hours: 0
            };
            
            console.log("Created synthetic data for preview mode:", {
              delivery: syntheticDeliveryData,
              recipient: syntheticRecipientData,
              condition: syntheticConditionData
            });
            
            setDeliveryData(syntheticDeliveryData);
            setRecipientData(syntheticRecipientData);
            setConditionData(syntheticConditionData);
          }
          
          setIsLoading(false);
          return;
        } catch (err) {
          console.error("Error in preview mode:", err);
          setError("Preview mode error: " + (err instanceof Error ? err.message : String(err)));
          setIsLoading(false);
          return;
        }
      }
      
      try {
        console.log(`Verifying access with params:`);
        console.log(`- messageId: ${messageId}`);
        console.log(`- deliveryId: ${deliveryId}`);
        console.log(`- recipientEmail: ${recipientEmail}`);

        // Try using the edge function first (preferred method) - but fall back to direct DB query
        try {
          console.log("Attempting to use edge function for access verification...");
          const { data: edgeFnResult, error: edgeFnError } = await supabase.functions.invoke("access-message", {
            body: { 
              messageId, 
              deliveryId,
              recipientEmail: decodeURIComponent(recipientEmail)
            }
          });
          
          if (edgeFnError) {
            console.error("Edge function error:", edgeFnError);
            throw new Error(`Edge function failed: ${edgeFnError.message}`);
          }
          
          if (edgeFnResult && edgeFnResult.success) {
            console.log("Edge function verification successful!");
            setDeliveryData(edgeFnResult.delivery);
            setConditionData(edgeFnResult.conditions);
            setIsLoading(false);
            return;
          } else if (edgeFnResult && edgeFnResult.error) {
            console.error("Edge function returned error:", edgeFnResult.error);
            throw new Error(`Access verification failed: ${edgeFnResult.error}`);
          }
        } catch (edgeFnCallError) {
          console.error("Error calling edge function:", edgeFnCallError);
          console.log("Falling back to direct database verification...");
          // Continue to direct DB verification as fallback
        }
        
        // First, verify the delivery record with additional logging
        console.log(`Querying delivered_messages for delivery_id: ${deliveryId} and message_id: ${messageId}`);
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
          .eq('message_id', messageId);
        
        // Handle no results or error
        if (deliveryError) {
          console.error('Error verifying delivery:', deliveryError);
          console.error('Error details:', deliveryError.message);
          setError('Failed to verify message delivery. Database error.');
          setIsLoading(false);
          return;
        }
        
        if (!deliveryData || deliveryData.length === 0) {
          console.error('No delivery record found for the provided parameters');
          console.error(`Checked with: delivery_id=${deliveryId}, message_id=${messageId}`);
          
          // Additional diagnostic query to check for similar records
          const { data: similarRecords } = await supabase
            .from('delivered_messages')
            .select('delivery_id, message_id')
            .or(`delivery_id.eq.${deliveryId},message_id.eq.${messageId}`);
            
          if (similarRecords && similarRecords.length > 0) {
            console.log("Found similar records:", similarRecords);
          }
          
          setError('This message link is invalid or has expired. No delivery record found.');
          setIsLoading(false);
          return;
        }
        
        // Since we're not using .single(), handle the array result
        const deliveryRecord = deliveryData[0];
        console.log('Delivery data found:', deliveryRecord);
        setDeliveryData(deliveryRecord);
        
        // Verify the recipient email
        console.log(`Querying recipients with ID: ${deliveryRecord.recipient_id} to match email: ${recipientEmail}`);
        const { data: recipientData, error: recipientError } = await supabase
          .from('recipients')
          .select('id, email')
          .eq('id', deliveryRecord.recipient_id);
          
        if (recipientError) {
          console.error('Error verifying recipient:', recipientError);
          console.error('Error details:', recipientError.message);
          setError('Failed to verify recipient. Database error.');
          setIsLoading(false);
          return;
        }
        
        if (!recipientData || recipientData.length === 0) {
          console.error('No recipient found with the provided ID');
          console.error(`Checked with recipient_id=${deliveryRecord.recipient_id}`);
          setError('Recipient not found. This message might have been sent to a different recipient.');
          setIsLoading(false);
          return;
        }
        
        const recipientRecord = recipientData[0];
        console.log('Recipient record found:', recipientRecord);
        
        // Compare emails with case-insensitive matching and careful debugging
        const dbEmail = recipientRecord.email.toLowerCase();
        const urlEmail = recipientEmail.toLowerCase();
        
        console.log(`Comparing emails - DB: '${dbEmail}', URL: '${urlEmail}'`);
        
        if (dbEmail !== urlEmail) {
          console.error('Recipient email mismatch:');
          console.error(`- DB email: ${dbEmail}`);
          console.error(`- URL email: ${urlEmail}`);
          setError('Unauthorized access. This message is intended for a different recipient.');
          setIsLoading(false);
          return;
        }
        
        console.log('Recipient verified:', recipientRecord);
        setRecipientData(recipientRecord);
        
        // Check if there are any security constraints
        console.log(`Querying message_conditions with ID: ${deliveryRecord.condition_id}`);
        const { data: conditionData, error: conditionError } = await supabase
          .from('message_conditions')
          .select('pin_code, unlock_delay_hours')
          .eq('id', deliveryRecord.condition_id);
        
        if (conditionError) {
          console.error('Error fetching message conditions:', conditionError);
          console.error('Error details:', conditionError.message);
          setError('Unable to verify message access conditions.');
          setIsLoading(false);
          return;
        }
        
        if (!conditionData || conditionData.length === 0) {
          console.error('No conditions found for the provided condition ID');
          console.error(`Checked with condition_id=${deliveryRecord.condition_id}`);
          setError('Message security conditions not found.');
          setIsLoading(false);
          return;
        }
        
        console.log('Security conditions retrieved:', conditionData[0]);
        setConditionData(conditionData[0]);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Error verifying access:', err);
        setError(`An error occurred while verifying access to this message: ${err.message}. Please try again later.`);
        setIsLoading(false);
      }
    };
    
    verifyAccess();
  }, [messageId, deliveryId, recipientEmail, isPreviewMode]);

  return {
    isLoading,
    error,
    deliveryData,
    recipientData,
    conditionData
  };
};
