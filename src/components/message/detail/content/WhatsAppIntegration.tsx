
import { useState, useEffect } from "react";
import { WhatsAppHeader } from "./whatsapp/WhatsAppHeader";
import { WhatsAppButtons } from "./whatsapp/WhatsAppButtons";
import { WhatsAppCheckIn } from "./whatsapp/WhatsAppCheckIn";
import { supabase } from "@/integrations/supabase/client";
import { 
  sendTestWhatsAppMessage, 
  sendTestWhatsAppTemplate 
} from "@/services/messages/whatsApp";

interface WhatsAppIntegrationProps {
  messageId: string;
  panicConfig?: {
    methods?: string[];
    trigger_keyword?: string;
  };
}

export function WhatsAppIntegration({ messageId, panicConfig }: WhatsAppIntegrationProps) {
  const [checkInCode, setCheckInCode] = useState<string | null>(null);
  
  useEffect(() => {
    // Fetch custom check-in code if it exists
    const fetchCheckInCode = async () => {
      if (!messageId) return;
      
      try {
        const { data, error } = await supabase
          .from("message_conditions")
          .select("check_in_code")
          .eq("message_id", messageId)
          .single();
          
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
  
  const handleTestTemplate = async () => {
    if (!messageId) return;
    await sendTestWhatsAppTemplate(messageId);
  };
  
  return (
    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
      <div className="flex items-center justify-between">
        <WhatsAppHeader />
        <WhatsAppButtons 
          onSendTestWhatsApp={handleSendTestWhatsApp}
          onSendTestTemplate={handleTestTemplate}
        />
      </div>
      
      {panicConfig?.trigger_keyword && (
        <div className="mt-2 text-xs text-gray-600">
          <span className="font-medium">Trigger keyword:</span> "{panicConfig.trigger_keyword}"
        </div>
      )}
      
      <WhatsAppCheckIn checkInCode={checkInCode} />
    </div>
  );
}
