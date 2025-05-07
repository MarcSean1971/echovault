
import { useState, useEffect } from "react";
import { WhatsAppHeader } from "./whatsapp/WhatsAppHeader";
import { WhatsAppButtons } from "./whatsapp/WhatsAppButtons";
import { WhatsAppCheckIn } from "./whatsapp/WhatsAppCheckIn";
import { supabase } from "@/integrations/supabase/client";
import { sendTestWhatsAppMessage } from "@/services/messages/whatsApp";
import { Button } from "@/components/ui/button";
import { InfoIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface WhatsAppIntegrationProps {
  messageId: string;
  panicConfig?: {
    methods?: string[];
    trigger_keyword?: string;
  };
}

export function WhatsAppIntegration({ messageId, panicConfig }: WhatsAppIntegrationProps) {
  const [checkInCode, setCheckInCode] = useState<string | null>(null);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  
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
  
  return (
    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
      <div className="flex items-center justify-between">
        <WhatsAppHeader />
        <WhatsAppButtons 
          onSendTestWhatsApp={handleSendTestWhatsApp}
        />
      </div>
      
      {panicConfig?.trigger_keyword && (
        <div className="mt-2 text-xs text-gray-600">
          <span className="font-medium">Trigger keyword:</span> "{panicConfig.trigger_keyword}"
        </div>
      )}
      
      <WhatsAppCheckIn checkInCode={checkInCode} />
      
      <Collapsible open={isDebugOpen} onOpenChange={setIsDebugOpen} className="mt-3 border-t pt-3 border-blue-100">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="flex items-center text-xs text-blue-700">
            <InfoIcon className="h-3 w-3 mr-1" />
            {isDebugOpen ? "Hide Troubleshooting" : "WhatsApp Troubleshooting"}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="text-xs space-y-2 mt-2 text-gray-600 bg-blue-100/50 p-2 rounded">
          <p><strong>Testing WhatsApp Integration:</strong></p>
          <ol className="list-decimal ml-4 space-y-1">
            <li>Use the <strong>Test Message</strong> button to send a simple text message</li>
          </ol>
          <p className="mt-2"><strong>Tips for using WhatsApp with this app:</strong></p>
          <ul className="list-disc ml-4 space-y-1">
            <li>Add the Twilio WhatsApp sandbox number to your contacts</li>
            <li>Send "join &lt;code&gt;" to the WhatsApp number first</li>
            <li>Make sure your phone number is in international format (e.g., +1234567890)</li>
            <li>For emergencies, simply send "{panicConfig?.trigger_keyword || "SOS"}" to the WhatsApp number</li>
            <li>For check-ins, send "CHECKIN" or your custom check-in code if configured</li>
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
