
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Smartphone, Bell } from "lucide-react";
import { HOVER_TRANSITION, ICON_HOVER_EFFECTS } from "@/utils/hoverEffects";
import { triggerManualReminder } from "@/services/messages/whatsApp/whatsAppReminderService";

interface WhatsAppButtonsProps {
  onSendTestWhatsApp: () => Promise<void>;
  messageId: string;
}

export function WhatsAppButtons({ 
  onSendTestWhatsApp, 
  messageId 
}: WhatsAppButtonsProps) {
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);

  const handleSendTestWhatsApp = async () => {
    try {
      setIsSendingWhatsApp(true);
      await onSendTestWhatsApp();
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const handleTestReminder = async () => {
    try {
      setIsSendingReminder(true);
      await triggerManualReminder(messageId);
    } finally {
      setIsSendingReminder(false);
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
        disabled={isSendingReminder}
        onClick={handleTestReminder}
        className={`flex items-center ${HOVER_TRANSITION}`}
      >
        <Bell className={`h-3 w-3 mr-1 ${ICON_HOVER_EFFECTS.default}`} />
        {isSendingReminder ? "Sending..." : "Test Reminder"}
      </Button>
    </div>
  );
}
