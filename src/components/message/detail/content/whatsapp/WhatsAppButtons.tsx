
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Smartphone, AlertTriangle, Shield } from "lucide-react";
import { HOVER_TRANSITION, ICON_HOVER_EFFECTS } from "@/utils/hoverEffects";
import { testWhatsAppTrigger } from "@/services/messages/whatsApp";

interface WhatsAppButtonsProps {
  onSendTestWhatsApp: () => Promise<void>;
  onSendTestTemplate: () => Promise<void>;
}

export function WhatsAppButtons({ 
  onSendTestWhatsApp, 
  onSendTestTemplate 
}: WhatsAppButtonsProps) {
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [isSendingTemplate, setIsSendingTemplate] = useState(false);
  const [isTestingTrigger, setIsTestingTrigger] = useState(false);

  const handleSendTestWhatsApp = async () => {
    try {
      setIsSendingWhatsApp(true);
      await onSendTestWhatsApp();
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const handleTestTemplate = async () => {
    try {
      setIsSendingTemplate(true);
      await onSendTestTemplate();
    } finally {
      setIsSendingTemplate(false);
    }
  };
  
  const handleTestTrigger = async () => {
    try {
      setIsTestingTrigger(true);
      await testWhatsAppTrigger("SOS");
    } finally {
      setIsTestingTrigger(false);
    }
  };

  return (
    <div className="space-x-2">
      <Button 
        variant="outline"
        size="sm"
        disabled={isSendingWhatsApp}
        onClick={handleSendTestWhatsApp}
        className={`flex items-center ${HOVER_TRANSITION}`}
      >
        <Smartphone className={`h-3 w-3 mr-1 ${ICON_HOVER_EFFECTS.default}`} />
        {isSendingWhatsApp ? "Sending..." : "Test Message"}
      </Button>
      <Button 
        variant="outline"
        size="sm"
        disabled={isSendingTemplate}
        onClick={handleTestTemplate}
        className={`flex items-center ${HOVER_TRANSITION}`}
      >
        <AlertTriangle className={`h-3 w-3 mr-1 ${ICON_HOVER_EFFECTS.default}`} />
        {isSendingTemplate ? "Sending..." : "Test Template"}
      </Button>
      <Button 
        variant="outline"
        size="sm"
        disabled={isTestingTrigger}
        onClick={handleTestTrigger}
        className={`flex items-center ${HOVER_TRANSITION} text-red-600 border-red-200 hover:bg-red-50`}
      >
        <Shield className={`h-3 w-3 mr-1 ${ICON_HOVER_EFFECTS.default}`} />
        {isTestingTrigger ? "Testing..." : "Test SOS"}
      </Button>
    </div>
  );
}
