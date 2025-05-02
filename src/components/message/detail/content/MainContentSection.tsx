
import { MessageHeader } from "../MessageHeader";
import { MessageContent } from "../MessageContent";
import { MessageAttachments } from "../MessageAttachments";
import { MessageDeliverySettings } from "../MessageDeliverySettings";
import { Separator } from "@/components/ui/separator";
import { WhatsAppIntegration } from "./WhatsAppIntegration";
import { Message } from "@/types/message";

interface MainContentSectionProps {
  message: Message;
  isArmed: boolean;
  isActionLoading: boolean;
  condition: any;
  formatDate: (dateString: string) => string;
  renderConditionType: () => string;
  handleDisarmMessage: () => Promise<void>;
  handleArmMessage: () => Promise<void>;
}

export function MainContentSection({
  message,
  isArmed,
  isActionLoading,
  condition,
  formatDate,
  renderConditionType,
  handleDisarmMessage,
  handleArmMessage
}: MainContentSectionProps) {
  // Check if this is a WhatsApp-enabled panic trigger
  const isPanicTrigger = condition?.condition_type === 'panic_trigger';
  const isWhatsAppPanicTrigger = isPanicTrigger && 
                               (condition?.panic_config?.methods?.includes('whatsapp'));

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <MessageHeader 
          message={message} 
          isArmed={isArmed}
          isActionLoading={isActionLoading}
          handleDisarmMessage={handleDisarmMessage}
          handleArmMessage={handleArmMessage}
        />
        
        {/* Message Content Section */}
        <div className="mt-6">
          <h2 className="text-lg font-medium mb-4">Message</h2>
          <MessageContent 
            message={message} 
            isArmed={isArmed} 
          />
          
          {message.attachments && message.attachments.length > 0 && (
            <MessageAttachments message={message} />
          )}
        </div>
        
        {/* Separator between content and delivery settings */}
        <Separator className="my-6" />
        
        {/* Delivery Settings Section */}
        <div className="mt-6">
          <h2 className="text-lg font-medium mb-4">Delivery</h2>
          <MessageDeliverySettings 
            condition={condition}
            formatDate={formatDate}
            renderConditionType={renderConditionType} 
          />
        </div>
        
        {/* Add WhatsApp Test Button for WhatsApp panic triggers */}
        {isWhatsAppPanicTrigger && (
          <WhatsAppIntegration 
            messageId={message.id} 
            panicConfig={condition?.panic_config} 
          />
        )}
      </div>
    </div>
  );
}
