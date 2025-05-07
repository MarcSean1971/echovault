
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Smartphone } from "lucide-react";
import { HOVER_TRANSITION, ICON_HOVER_EFFECTS } from "@/utils/hoverEffects";

interface WhatsAppButtonsProps {
  onSendTestWhatsApp: () => Promise<void>;
  messageId: string;
}

export function WhatsAppButtons({ 
  onSendTestWhatsApp, 
  messageId 
}: WhatsAppButtonsProps) {
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

  const handleSendTestWhatsApp = async () => {
    try {
      setIsSendingWhatsApp(true);
      await onSendTestWhatsApp();
    } finally {
      setIsSendingWhatsApp(false);
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
    </div>
  );
}
