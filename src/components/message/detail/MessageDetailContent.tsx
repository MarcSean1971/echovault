
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
import { Edit, Eye, Mail, Trash2, Download } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";
import { WhatsAppIntegration } from "./content/WhatsAppIntegration";
import { toast } from "@/components/ui/use-toast";

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
  // Add state for delete confirmation and public view dialog
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPublicViewHelp, setShowPublicViewHelp] = useState(false);
  const navigate = useNavigate();
  const transcription = message && message.message_type !== 'text' ? 
    extractTranscription(message.message_type, message.content) : null;
  
  // Check if this is a WhatsApp-enabled panic trigger
  const isPanicTrigger = condition?.condition_type === 'panic_trigger';
  const isWhatsAppPanicTrigger = isPanicTrigger && 
                               condition?.panic_config && 
                               condition?.panic_config?.methods?.includes('whatsapp');
  
  // Function to generate a public test view URL
  const generatePublicTestViewUrl = () => {
    // Check if we have existing delivered_messages for this message
    // Get a random recipient from the list
    if (!recipients || recipients.length === 0) {
      toast({
        title: "No recipients available",
        description: "Please add recipients to this message before testing the public view.",
        variant: "destructive"
      });
      return;
    }
    
    // Get the first recipient
    const recipient = recipients[0];
    
    // Generate a valid delivery ID format instead of a random test one
    // Using a consistent format: preview-{message-id}-{timestamp}
    const testDeliveryId = `preview-${message.id.substring(0, 8)}-${Date.now()}`;
    
    // Build the URL with debug flag
    const publicViewUrl = `/access/message/${message.id}?delivery=${testDeliveryId}&recipient=${encodeURIComponent(recipient.email)}&debug=true&preview=true`;
    
    // Copy the URL to the clipboard
    navigator.clipboard.writeText(window.location.origin + publicViewUrl);
    
    // Show the dialog with instructions
    setShowPublicViewHelp(true);
    
    // Return the URL for navigation
    return publicViewUrl;
  };
  
  // Function to open the public view in a new tab
  const openPublicTestView = () => {
    const url = generatePublicTestViewUrl();
    if (url) {
      window.open(url, '_blank');
    }
  };

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
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium">Attachments</h2>
                    <Button 
                      onClick={openPublicTestView}
                      className={`bg-blue-600 hover:bg-blue-700 text-white ${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
                    >
                      <Eye className={`h-4 w-4 mr-2 ${HOVER_TRANSITION}`} />
                      Test Public View
                    </Button>
                  </div>
                  <MessageAttachments message={message} />
                </div>
              </>
            )}
            
            {/* Add WhatsApp Test Button for WhatsApp panic triggers */}
            {isWhatsAppPanicTrigger && (
              <>
                <Separator className="my-4" />
                <WhatsAppIntegration 
                  messageId={message.id} 
                  panicConfig={condition?.panic_config} 
                />
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
                <div className="flex gap-2">
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
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openPublicTestView}
                    className={`whitespace-nowrap bg-blue-50 hover:bg-blue-100 border-blue-200 ${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
                  >
                    <Eye className={`h-4 w-4 mr-2 ${HOVER_TRANSITION}`} />
                    Test Public View
                  </Button>
                </div>
              </div>
              
              <div className="mt-2">
                <MessageRecipientsList recipients={recipients} />
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Action Footer - Only essential actions, no duplicates */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t z-10">
          <div className="flex gap-2 w-full max-w-3xl mx-auto">
            <Button
              variant="outline"
              onClick={() => navigate(`/message/${message.id}/edit`)}
              disabled={isArmed || isActionLoading}
              className="sm:ml-auto"
            >
              <Edit className="h-4 w-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Edit</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isArmed || isActionLoading}
              className="text-destructive border-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Delete</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Delete confirmation sheet */}
      <Sheet open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Are you sure?</SheetTitle>
            <SheetDescription>
              This action cannot be undone. This will permanently delete your message.
            </SheetDescription>
          </SheetHeader>
          <SheetFooter className="flex-row justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      
      {/* Public View Help Sheet */}
      <Sheet open={showPublicViewHelp} onOpenChange={setShowPublicViewHelp}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Testing Public Message View</SheetTitle>
            <SheetDescription>
              A public test URL has been copied to your clipboard and will open in a new tab.
            </SheetDescription>
          </SheetHeader>
          <div className="py-4 space-y-4">
            <p>This URL simulates how recipients would see your message. You should see:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>The message content</li>
              <li>All attachments with download buttons</li>
              <li><strong>A green "Download All" button</strong> at the top of the attachments section</li>
              <li>Each attachment having a green "Secure Download" button</li>
            </ul>
            <div className="bg-blue-50 p-4 rounded">
              <p className="font-medium text-blue-800">Debugging is automatically enabled in test view mode.</p>
              <p className="text-blue-700 text-sm mt-1">If download buttons are not visible, click the "Debug" button in the top right to see detailed information.</p>
            </div>
            <div className="bg-amber-50 p-4 rounded mt-2">
              <p className="font-medium text-amber-800">Note about Testing:</p>
              <p className="text-amber-700 text-sm mt-1">
                The public view uses a test delivery ID which won't match real message deliveries.
                This is expected and will show a message not found error initially.
                Click the "Debug" button to see message information.
              </p>
            </div>
          </div>
          <SheetFooter className="flex-row justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowPublicViewHelp(false)}>
              Close
            </Button>
            <Button onClick={openPublicTestView} className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}>
              <Eye className={`h-4 w-4 mr-2 ${HOVER_TRANSITION}`} />
              Open Test View Again
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      
      <SendTestMessageDialog 
        open={showSendTestDialog}
        onOpenChange={setShowSendTestDialog}
        messageTitle={message.title}
        recipients={recipients}
      />
    </div>
  );
}
