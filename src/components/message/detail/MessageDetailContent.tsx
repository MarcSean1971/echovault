
import React, { useState } from "react";
import { MessageHeader } from "./MessageHeader";
import { MessageContent } from "./MessageContent";
import { MessageAttachments } from "./MessageAttachments";
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
import { Message } from "@/types/message";
import { Separator } from "@/components/ui/separator";

interface MessageDetailContentProps {
  message: Message;
  isLoading: boolean;
  isArmed: boolean;
  isActionLoading: boolean;
  deadline: Date | null;
  conditionId: string | null;
  condition: any;
  handleDisarmMessage: () => Promise<void>;
  handleArmMessage: () => Promise<void>;
  handleDelete: () => Promise<void>;
  formatDate: (dateString: string) => string;
  renderConditionType: () => string;
  renderRecipients: () => React.ReactNode;
  recipients: any[];
  onSendTestMessage: () => void;
  showSendTestDialog: boolean;
  setShowSendTestDialog: (show: boolean) => void;
  handleSendTestMessages: (selectedRecipients: { id: string; name: string; email: string }[]) => Promise<void>;
}

export function MessageDetailContent({
  message,
  isLoading,
  isArmed,
  isActionLoading,
  deadline,
  conditionId,
  condition,
  handleDisarmMessage,
  handleArmMessage,
  handleDelete,
  formatDate,
  renderConditionType,
  renderRecipients,
  recipients,
  onSendTestMessage,
  showSendTestDialog,
  setShowSendTestDialog,
  handleSendTestMessages
}: MessageDetailContentProps) {
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Check if this is a WhatsApp-enabled panic trigger
  const isPanicTrigger = condition?.condition_type === 'panic_trigger';
  const isWhatsAppPanicTrigger = isPanicTrigger && 
                               (condition?.panic_config?.methods?.includes('whatsapp'));

  const handleSendTestWhatsApp = async () => {
    if (!message?.id) return;
    
    try {
      setIsSendingWhatsApp(true);
      await sendTestWhatsAppMessage(message.id);
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

  if (isLoading) {
    return <MessageLoading />;
  }

  if (!message) {
    return <MessageNotFound />;
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Switch from grid to flex layout with adjusted percentages */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content area - reduced from 66.66% to 51.66% (15% decrease) */}
        <div className="w-full lg:w-[51.66%] order-2 lg:order-1">
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
                  
                  {(condition?.panic_config?.trigger_keyword) && (
                    <div className="mt-2 text-xs text-gray-600">
                      <span className="font-medium">Trigger keyword:</span> "
                      {condition?.panic_config?.trigger_keyword}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Sidebar - increased from 33.33% to 48.33% (15% increase) */}
        <div className="w-full lg:w-[48.33%] order-1 lg:order-2">
          <MessageSidebar 
            message={message}
            isArmed={isArmed}
            conditionId={conditionId}
            isActionLoading={isActionLoading}
            formatDate={formatDate}
            renderConditionType={renderConditionType}
            renderRecipients={renderRecipients}
            handleDisarmMessage={handleDisarmMessage}
            handleArmMessage={handleArmMessage}
            showDeleteConfirm={showDeleteConfirm}
            setShowDeleteConfirm={setShowDeleteConfirm}
            handleDelete={handleDelete}
            recipients={recipients}
            onSendTestMessage={onSendTestMessage}
            condition={condition}
          />
        </div>
      </div>
      
      <SendTestMessageDialog 
        open={showSendTestDialog}
        onOpenChange={setShowSendTestDialog}
        messageTitle={message.title}
        recipients={recipients}
      />
    </div>
  );
}
