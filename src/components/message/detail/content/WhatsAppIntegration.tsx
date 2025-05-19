import { useState, useEffect } from "react";
import { WhatsAppHeader } from "./whatsapp/WhatsAppHeader";
import { WhatsAppButtons } from "./whatsapp/WhatsAppButtons";
import { WhatsAppCheckIn } from "./whatsapp/WhatsAppCheckIn";
import { supabase } from "@/integrations/supabase/client";
import { sendTestWhatsAppMessage } from "@/services/messages/whatsApp/core/messageService";
interface WhatsAppIntegrationProps {
  messageId: string;
  panicConfig?: {
    methods?: string[];
    trigger_keyword?: string;
  };
}
export function WhatsAppIntegration({
  messageId,
  panicConfig
}: WhatsAppIntegrationProps) {
  const [checkInCode, setCheckInCode] = useState<string | null>(null);
  useEffect(() => {
    // Fetch custom check-in code if it exists
    const fetchCheckInCode = async () => {
      if (!messageId) return;
      try {
        const {
          data,
          error
        } = await supabase.from("message_conditions").select("check_in_code").eq("message_id", messageId).single();
        if (error) throw error;
        if (data && data.check_in_code) {
          setCheckInCode(data.check_in_code);
        }
      } catch (error) {
        console.error("Error fetching check-in code:", error);
      }
    };
    fetchCheckInCode();
  }, [messageId]);
  const handleSendTestWhatsApp = async () => {
    if (!messageId) return;
    await sendTestWhatsAppMessage(messageId);
  };

  // Return the JSX elements for the WhatsApp integration
  return <div className="space-y-4">
      <WhatsAppHeader />
      
      
    </div>;
}