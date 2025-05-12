
import React, { useState } from "react";
import { Message } from "@/types/message";
import { MessageLoading } from "./MessageLoading";
import { MessageNotFound } from "./MessageNotFound";
import { SendTestMessageDialog } from "./SendTestMessageDialog";
import { useSearchParams } from "react-router-dom";
import { MainContentSection } from "./content/MainContentSection";
import { StatusDeliverySection } from "./content/StatusDeliverySection";
import { RecipientsSection } from "./content/RecipientsSection";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { MessageSidebar } from "./MessageSidebar"; // Add this import

interface MessageDetailContentProps {
  message: Message;
  isLoading: boolean;
  isArmed: boolean;
  isActionLoading: boolean;
  deadline: Date | null;
  conditionId: string | null;
  condition: any;
  handleDisarmMessage: () => Promise<void>;
  handleArmMessage: () => Promise<Date | null>;
  handleDelete: () => Promise<void>;
  formatDate: (dateString: string) => string;
  renderConditionType: () => string;
  renderRecipients: () => React.ReactNode;
  recipients: any[];
  onSendTestMessage: () => void;
  showSendTestDialog: boolean;
  setShowSendTestDialog: (show: boolean) => void;
  handleSendTestMessages: (selectedRecipients: { id: string; name: string; email: string }[]) => Promise<void>;
  lastCheckIn?: string | null;
  checkInCode?: string | null;
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
  handleSendTestMessages,
  lastCheckIn,
  checkInCode
}: MessageDetailContentProps) {
  // Add state for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();
  
  // Get delivery ID and recipient email from URL for attachment access
  const [searchParams] = useSearchParams();
  const deliveryId = searchParams.get('delivery');
  const recipientEmail = searchParams.get('recipient');

  if (isLoading) {
    return <MessageLoading />;
  }

  if (!message) {
    return <MessageNotFound />;
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content (2/3 width on large screens) */}
        <div className="lg:col-span-2 order-2 lg:order-1 space-y-6">
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
          
          {/* Status and Delivery Settings - Now with check-in information */}
          <StatusDeliverySection
            condition={condition}
            isArmed={isArmed}
            formatDate={formatDate}
            renderConditionType={renderConditionType}
            message={message}
            deadline={deadline}
            lastCheckIn={lastCheckIn}
            checkInCode={checkInCode}
          />
          
          {/* Recipients Section */}
          <RecipientsSection
            recipients={recipients}
            isArmed={isArmed}
            isActionLoading={isActionLoading}
            onSendTestMessage={onSendTestMessage}
          />
          
          {/* Mobile-only Action Buttons */}
          <div className="lg:hidden">
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/message/${message.id}/edit`)}
                    disabled={isArmed || isActionLoading}
                    className={HOVER_TRANSITION}
                  >
                    <Edit className={`h-4 w-4 mr-2 ${HOVER_TRANSITION}`} /> Edit
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isArmed || isActionLoading}
                    className={`text-destructive border-destructive hover:bg-destructive/20 hover:text-destructive ${HOVER_TRANSITION}`}
                  >
                    <Trash2 className={`h-4 w-4 mr-2 ${HOVER_TRANSITION}`} /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Sidebar (1/3 width on large screens) */}
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
      
      <SendTestMessageDialog 
        open={showSendTestDialog}
        onOpenChange={setShowSendTestDialog}
        messageTitle={message.title}
        recipients={recipients}
        onSendTestMessages={handleSendTestMessages}
      />
      
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
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
