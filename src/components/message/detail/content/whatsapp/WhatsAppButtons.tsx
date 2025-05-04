
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Smartphone, AlertTriangle } from "lucide-react";
import { HOVER_TRANSITION, ICON_HOVER_EFFECTS } from "@/utils/hoverEffects";

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
    </div>
  );
}
