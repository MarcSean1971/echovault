
import React, { useState } from "react";
import { MessageLoading } from "./MessageLoading";
import { MessageNotFound } from "./MessageNotFound";
import { SendTestMessageDialog } from "./SendTestMessageDialog";
import { Message } from "@/types/message";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/status-badge";
import { MessageDeliverySettings } from "./MessageDeliverySettings";
import { MessageRecipientsList } from "./MessageRecipientsList";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useSearchParams } from "react-router-dom";
import { DeadmanSwitchControls } from "./content/deadman/DeadmanSwitchControls";
import { ReminderHistory } from "./content/deadman/ReminderHistory";
import { MainContentSection } from "./content/MainContentSection";
import { MessageActionFooter } from "./MessageActionFooter";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

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
  
  // Get delivery ID and recipient email from URL for attachment access
  const [searchParams] = useSearchParams();
  const deliveryId = searchParams.get('delivery');
  const recipientEmail = searchParams.get('recipient');
                               
  // Check if this is a deadman's switch with reminders
  const isDeadmanSwitch = condition?.condition_type === 'no_check_in';
  const hasReminderHours = condition?.reminder_hours && condition.reminder_hours.length > 0;

  if (isLoading) {
    return <MessageLoading />;
  }

  if (!message) {
    return <MessageNotFound />;
  }

  return (
    <div className="max-w-3xl mx-auto py-4 px-4 sm:px-6 pb-20 mb-16">
      <div className="space-y-6">
        {/* Message Content */}
        <MainContentSection 
          message={message}
          isArmed={isArmed}
          isActionLoading={isActionLoading}
          condition={condition}
          formatDate={formatDate}
          renderConditionType={renderConditionType}
          handleDisarmMessage={handleDisarmMessage}
          handleArmMessage={handleArmMessage}
          deliveryId={deliveryId}
          recipientEmail={recipientEmail}
        />
        
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
            
            {/* Add Deadman's Switch Reminder Controls */}
            {isDeadmanSwitch && hasReminderHours && (
              <>
                <Separator className="my-4" />
                <DeadmanSwitchControls 
                  messageId={message.id}
                  reminderHours={condition.reminder_hours}
                  isArmed={isArmed}
                />
                
                <ReminderHistory messageId={message.id} />
              </>
            )}
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
                  <Mail className={`h-4 w-4 mr-2 ${HOVER_TRANSITION}`} />
                  Send Test Message
                </Button>
              </div>
              
              <div className="mt-2">
                <MessageRecipientsList recipients={recipients} />
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Action Footer */}
        <MessageActionFooter
          messageId={message.id}
          isArmed={isArmed}
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
