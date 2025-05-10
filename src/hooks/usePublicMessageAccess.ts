
import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/types/message";
import { useSecurityConstraints } from "./message-access/useSecurityConstraints";
import { toast } from "@/components/ui/use-toast";

export function usePublicMessageAccess() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { convertDatabaseMessageToMessage } = useSecurityConstraints();
  
  const [message, setMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [isPinRequired, setIsPinRequired] = useState(false);
  const [isUnlockDelayed, setIsUnlockDelayed] = useState(false);
  const [unlockTime, setUnlockTime] = useState<Date | null>(null);
  
  // Fetch message with delivery token
  const fetchMessageWithToken = useCallback(async () => {
    try {
      setIsLoading(true);
      const deliveryId = searchParams.get('delivery');
      
      if (!id || !deliveryId) {
        setIsLoading(false);
        return;
      }
      
      // First check if this is a valid delivery
      const { data: deliveryData, error: deliveryError } = await supabase
        .from('delivered_messages')
        .select('*')
        .eq('message_id', id)
        .eq('delivery_id', deliveryId)
        .single();
        
      if (deliveryError || !deliveryData) {
        console.error("Error fetching message delivery:", deliveryError);
        setIsLoading(false);
        return;
      }
      
      // Mark as viewed if not already
      if (!deliveryData.viewed_at) {
        await supabase
          .from('delivered_messages')
          .update({
            viewed_at: new Date().toISOString(),
            viewed_count: (deliveryData.viewed_count || 0) + 1
          })
          .eq('id', deliveryData.id);
      }
      
      // Now fetch the actual message
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .select('*')
        .eq('id', id)
        .single();
        
      if (messageError || !messageData) {
        console.error("Error fetching message:", messageError);
        setIsLoading(false);
        return;
      }
      
      // Convert to our Message type
      const convertedMessage = convertDatabaseMessageToMessage(messageData);
      setMessage(convertedMessage);
      
      // Auto-verify for delivery token access
      setIsVerified(true);
    } catch (error: any) {
      console.error("Error in fetchMessageWithToken:", error);
      toast({
        title: "Error",
        description: "Failed to load the message",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [id, searchParams, convertDatabaseMessageToMessage]);
  
  // Method to verify PIN code
  const verifyPin = useCallback((pinCode: string) => {
    // Implementation details would go here
    console.log("Verifying PIN:", pinCode);
    setIsVerified(true);
    return true;
  }, []);
  
  // Method to handle expired unlock time
  const handleUnlockExpired = useCallback(() => {
    setIsUnlockDelayed(false);
    setUnlockTime(null);
  }, []);
  
  // Effect to fetch message on initial load
  useEffect(() => {
    fetchMessageWithToken();
  }, [fetchMessageWithToken]);
  
  return {
    isPinRequired,
    isUnlockDelayed,
    unlockTime,
    isVerified,
    message,
    isLoading,
    verifyPin,
    handleUnlockExpired,
    fetchMessage: fetchMessageWithToken
  };
}
