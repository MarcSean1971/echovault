
// I'll create this component with a Test WhatsApp button
import React, { useState } from "react";
import { useMessageDetail } from "@/hooks/useMessageDetail";
import { MessageHeader } from "./MessageHeader";
import { MessageContent } from "./MessageContent";
import { MessageAttachments } from "./MessageAttachments";
import { MessageActionFooter } from "./MessageActionFooter";
import { MessageDeliverySettings } from "./MessageDeliverySettings";
import { MessageLoading } from "./MessageLoading";
import { MessageNotFound } from "./MessageNotFound";
import { Button } from "@/components/ui/button";
import { MessageSidebar } from "./MessageSidebar";
import { MessageMainCard } from "./MessageMainCard";
import { toast } from "@/components/ui/use-toast";
import { SendTestMessageDialog } from "./SendTestMessageDialog";
import { sendTestWhatsAppMessage } from "@/services/messages/notificationService";
import { Smartphone } from "lucide-react";

export function MessageDetailContent() {
  const { message, condition, isLoading, error, isConditionActive, isPanicTrigger } = useMessageDetail();
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

  const handleSendTestWhatsApp = async () => {
    if (!message?.id) return;
    
    try {
      setIsSendingWhatsApp(true);
      await sendTestWhatsAppMessage(message.id);
    } catch (error) {
      console.error("Error sending test WhatsApp:", error);
    } finally {
      setIsSendingWhatsApp(false);
    }
  };
  
  // Check if this is a WhatsApp-enabled panic trigger
  const isWhatsAppPanicTrigger = isPanicTrigger && condition?.panic_trigger_config?.methods?.includes('whatsapp');

  if (isLoading) {
    return <MessageLoading />;
  }

  if (error || !message) {
    return <MessageNotFound />;
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MessageMainCard>
            <MessageHeader message={message} />
            <MessageContent message={message} />
            {message.attachments && message.attachments.length > 0 && (
              <MessageAttachments attachments={message.attachments} />
            )}
            <MessageActionFooter 
              messageId={message.id}
              showTestButton={!!condition}
              onTestClick={() => setIsTestModalOpen(true)}
            />
            
            {/* Add WhatsApp Test Button for WhatsApp panic triggers */}
            {isWhatsAppPanicTrigger && (
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
                
                {condition?.panic_trigger_config?.trigger_keyword && (
                  <div className="mt-2 text-xs text-gray-600">
                    <span className="font-medium">Trigger keyword:</span> "{condition.panic_trigger_config.trigger_keyword}"
                  </div>
                )}
              </div>
            )}
          </MessageMainCard>
        </div>
        
        <MessageSidebar 
          message={message} 
          condition={condition} 
          isActive={isConditionActive} 
        />
      </div>
      
      {condition && (
        <MessageDeliverySettings 
          messageId={message.id}
          condition={condition}
          isActive={isConditionActive}
        />
      )}
      
      <SendTestMessageDialog 
        messageId={message.id} 
        open={isTestModalOpen}
        onOpenChange={setIsTestModalOpen}
      />
    </div>
  );
}
