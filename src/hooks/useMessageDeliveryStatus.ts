
import { useState, useEffect } from "react";
import { getAuthClient } from "@/lib/supabaseClient";
import { Message } from "@/types/message";

interface DeliveryStatus {
  isDelivered: boolean;
  deliveryDate: string | null;
  viewCount: number | null;
}

export function useMessageDeliveryStatus(messageId: string) {
  const [status, setStatus] = useState<DeliveryStatus>({
    isDelivered: false,
    deliveryDate: null,
    viewCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function checkDeliveryStatus() {
      if (!messageId) return;
      
      try {
        setIsLoading(true);
        const client = await getAuthClient();
        
        // Check if the message has been delivered
        const { data, error } = await client
          .from("delivered_messages")
          .select("delivered_at, viewed_at, viewed_count")
          .eq("message_id", messageId)
          .order("delivered_at", { ascending: false })
          .limit(1);
          
        if (error) {
          console.error("Error checking message delivery status:", error);
          return;
        }
        
        if (data && data.length > 0) {
          setStatus({
            isDelivered: true,
            deliveryDate: data[0].delivered_at,
            viewCount: data[0].viewed_count
          });
        }
      } catch (error) {
        console.error("Error in useMessageDeliveryStatus:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkDeliveryStatus();
  }, [messageId]);
  
  return { ...status, isLoading };
}
