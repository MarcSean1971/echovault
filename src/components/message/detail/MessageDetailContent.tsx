
import React, { useState } from "react";
import { MessageLoading } from "./MessageLoading";
import { MessageNotFound } from "./MessageNotFound";
import { SendTestMessageDialog } from "./SendTestMessageDialog";
import { Message } from "@/types/message";
import { MessageHeader } from "./MessageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { extractTranscription } from "@/utils/messageFormatUtils";
import { MessageContent } from "./MessageContent";
import { MessageAttachments } from "./MessageAttachments";
import { StatusBadge } from "@/components/ui/status-badge";
import { MessageDeliverySettings } from "./MessageDeliverySettings";
import { MessageRecipientsList } from "./MessageRecipientsList";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { MessageActionFooter } from "./MessageActionFooter";

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
  // Add state for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const transcription = message && message.message_type !== 'text' ? 
    extractTranscription(message.message_type, message.content) : null;
  
  if (isLoading) {
    return <MessageLoading />;
  }

  if (!message) {
    return <MessageNotFound />;
  }

  return (
    <div className="max-w-3xl mx-auto py-4 px-4 sm:px-6 pb-20 mb-16">
      <div className="space-y-6">
        {/* Message Header */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <MessageHeader 
              message={message}
              isArmed={isArmed}
              isActionLoading={isActionLoading}
              handleDisarmMessage={handleDisarmMessage}
              handleArmMessage={handleArmMessage}
            />
          </CardContent>
        </Card>
        
        {/* Message Content */}
        <Card className="overflow-hidden">
          <CardContent className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-medium mb-4">Message Content</h2>
              <MessageContent 
                message={message} 
                isArmed={isArmed} 
              />
            </div>
            
            {message.attachments && message.attachments.length > 0 && (
              <>
                <Separator className="my-4" />
                <MessageAttachments message={message} />
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Status and Delivery Settings */}
        <Card className="overflow-hidden">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-medium">Status & Delivery</h2>
              <StatusBadge status={isArmed ? "armed" : "disarmed"} size="default">
                {isArmed ? "Armed" : "Disarmed"}
              </StatusBadge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Message Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-3 gap-1">
                    <span className="font-medium">Created:</span>
                    <span className="col-span-2">{formatDate(message.created_at)}</span>
                  </div>
                  
                  {message.updated_at !== message.created_at && (
                    <div className="grid grid-cols-3 gap-1">
                      <span className="font-medium">Last updated:</span>
                      <span className="col-span-2">{formatDate(message.updated_at)}</span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-3 gap-1">
                    <span className="font-medium">Type:</span>
                    <span className="col-span-2">{message.message_type}</span>
                  </div>
                </div>
              </div>
              
              <div>
                {condition && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Delivery Settings</h3>
                    <MessageDeliverySettings 
                      condition={condition}
                      formatDate={formatDate}
                      renderConditionType={renderConditionType}
                      showInTabs={true}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Recipients Section */}
        {recipients && recipients.length > 0 && (
          <Card className="overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Recipients</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSendTestMessage}
                  disabled={isArmed || isActionLoading}
                  className="whitespace-nowrap"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Test Message
                </Button>
              </div>
              
              <div className="mt-2">
                <MessageRecipientsList recipients={recipients} />
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Action Footer - Fixed at bottom */}
        <MessageActionFooter
          messageId={message.id}
          isArmed={isArmed}
          conditionId={conditionId}
          isActionLoading={isActionLoading}
          handleArmMessage={handleArmMessage}
          handleDisarmMessage={handleDisarmMessage}
          showDeleteConfirm={showDeleteConfirm}
          setShowDeleteConfirm={setShowDeleteConfirm}
          handleDelete={handleDelete}
          onSendTestMessage={onSendTestMessage}
        />
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
