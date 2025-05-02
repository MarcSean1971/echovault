
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Smartphone } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { sendTestWhatsAppMessage } from "@/services/messages/notificationService";

interface WhatsAppIntegrationProps {
  messageId: string;
  panicConfig?: {
    methods?: string[];
    trigger_keyword?: string;
  };
}

export function WhatsAppIntegration({ messageId, panicConfig }: WhatsAppIntegrationProps) {
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  
  const handleSendTestWhatsApp = async () => {
    if (!messageId) return;
    
    try {
      setIsSendingWhatsApp(true);
      await sendTestWhatsAppMessage(messageId);
      toast({
        title: "WhatsApp Test Sent",
        description: "A test WhatsApp message has been sent to the first recipient with a phone number."
      });
    } catch (error) {
      console.error("Error sending test WhatsApp:", error);
      toast({
        title: "Error",
        description: "Failed to send test WhatsApp message",
        variant: "destructive"
      });
    } finally {
      setIsSendingWhatsApp(false);
    }
  };
  
  return (
    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium flex items-center">
            <Smartphone className="h-4 w-4 mr-2" />
            WhatsApp Integration
          </h3>
          <p className="text-sm text-gray-600">
            Test the WhatsApp notification for this message
          </p>
        </div>
        <Button 
          variant="outline"
          size="sm"
          disabled={isSendingWhatsApp}
          onClick={handleSendTestWhatsApp}
          className="flex items-center"
        >
          <Smartphone className="h-3 w-3 mr-1" />
          {isSendingWhatsApp ? "Sending..." : "Test WhatsApp"}
        </Button>
      </div>
      
      {panicConfig?.trigger_keyword && (
        <div className="mt-2 text-xs text-gray-600">
          <span className="font-medium">Trigger keyword:</span> "{panicConfig.trigger_keyword}"
        </div>
      )}
    </div>
  );
}
