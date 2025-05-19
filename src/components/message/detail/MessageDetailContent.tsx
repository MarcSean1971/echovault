
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
import { Skeleton } from "@/components/ui/skeleton";

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
  lastDelivered?: string | null;
  isDelivered?: boolean;
  viewCount?: number | null;
  isLoadingDelivery?: boolean;
  refreshTrigger?: number;
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
  checkInCode,
  lastDelivered,
  isDelivered,
  viewCount,
  isLoadingDelivery,
  refreshTrigger
}: MessageDetailContentProps) {
  // Add state for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();
  
  // Get delivery ID and recipient email from URL for attachment access
  const [searchParams] = useSearchParams();
  const deliveryId = searchParams.get('delivery');
  const recipientEmail = searchParams.get('recipient');

  // Full loading state is only displayed if we have no message at all
  if (!message) {
    return <MessageNotFound />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="space-y-6">
        {/* Message Content - Always render immediately with available data */}
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
          recipients={recipients}
          onSendTestMessage={onSendTestMessage}
          lastCheckIn={lastCheckIn}
          checkInCode={checkInCode}
          lastDelivered={lastDelivered}
          isDelivered={isDelivered}
          viewCount={viewCount}
          isLoadingDelivery={isLoadingDelivery}
          refreshTrigger={refreshTrigger}
          deadline={deadline}
          // Pass loading status for progressive loading
          isLoading={isLoading}
        />
        
        {/* Actions Card */}
        <Card className="overflow-hidden border border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => navigate(`/message/${message.id}/edit`)}
                disabled={isArmed || isActionLoading}
                className={`${HOVER_TRANSITION}`}
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
