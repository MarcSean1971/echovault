
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/types/message";

/**
 * Hook for fetching message data from Supabase
 */
export function useFetchMessageData() {
  const fetchMessageData = useCallback(async (messageId: string, userId: string) => {
    try {
      console.log(`[useMessageDetail] Fetching message data for message ${messageId}`);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('id', messageId)
        .single();
        
      if (error) throw error;
      
      console.log(`[useMessageDetail] Message data retrieved:`, data);
      return data as unknown as Message;
    } catch (error) {
      console.error("Error fetching message data:", error);
      throw error;
    }
  }, []);

  return { fetchMessageData };
}
