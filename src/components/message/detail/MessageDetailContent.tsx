
import React, { useState } from "react";
import { Message } from "@/types/message";
import { MessageLoading } from "./MessageLoading";
import { MessageNotFound } from "./MessageNotFound";
import { SendTestMessageDialog } from "./SendTestMessageDialog";
import { useSearchParams } from "react-router-dom";
import { MainContentSection } from "./content/MainContentSection";
import { StatusDeliverySection } from "./content/status-delivery/StatusDeliverySection";
import { RecipientsSection } from "./content/RecipientsSection";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, FileText, Settings, Trash2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageHeader } from "./MessageHeader"; // Added missing import
import { MessageContent } from "./content/message-content"; // Added missing import

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
  backButton: React.ReactNode; // Back button prop
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
  refreshTrigger,
  backButton // Back button prop
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

  const renderSectionHeader = (icon: React.ReactNode, title: string) => (
    <div className="flex items-center space-x-2 mb-4 pb-2 border-b">
      {icon}
      <h2 className="text-lg font-medium">{title}</h2>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button at the left side, matching Edit page placement */}
      {backButton}
      
      <div className="max-w-3xl mx-auto">
        <div className="space-y-6">
          {/* Message Header with Arm/Disarm button */}
          <Card className="overflow-hidden border border-border/50 shadow-sm">
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

          {/* SECTION 1: Message Content */}
          <Card className="overflow-hidden border border-border/50 shadow-sm">
            <CardContent className="p-6">
              {renderSectionHeader(
                <FileText className={`h-5 w-5 text-muted-foreground ${HOVER_TRANSITION}`} />, 
                "Message Content"
              )}
              {isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <div className="space-y-4">
                  <MessageContent 
                    message={message} 
                    deliveryId={deliveryId} 
                    recipientEmail={recipientEmail} 
                  />
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* SECTION 2: Trigger Settings */}
          <Card className="overflow-hidden border border-border/50 shadow-sm">
            <CardContent className="p-6">
              {renderSectionHeader(
                <Settings className={`h-5 w-5 text-muted-foreground ${HOVER_TRANSITION}`} />, 
                "Trigger Settings"
              )}
              {!condition ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-1/4" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : (
                <StatusDeliverySection
                  message={message}
                  condition={condition}
                  formatDate={formatDate}
                  renderConditionType={renderConditionType}
                  isArmed={isArmed}
                  refreshTrigger={refreshTrigger}
                  deadline={deadline}
                  lastCheckIn={lastCheckIn}
                  checkInCode={checkInCode}
                  lastDelivered={lastDelivered}
                  isDelivered={isDelivered}
                  viewCount={viewCount}
                  isLoadingDelivery={isLoadingDelivery}
                />
              )}
            </CardContent>
          </Card>
          
          {/* SECTION 3: Recipients */}
          <Card className="overflow-hidden border border-border/50 shadow-sm">
            <CardContent className="p-6">
              {renderSectionHeader(
                <Users className={`h-5 w-5 text-muted-foreground ${HOVER_TRANSITION}`} />, 
                "Recipients"
              )}
              {recipients && recipients.length > 0 ? (
                <RecipientsSection
                  recipients={recipients}
                  isArmed={isArmed}
                  isActionLoading={isActionLoading}
                  onSendTestMessage={onSendTestMessage}
                />
              ) : (
                <p className="text-muted-foreground text-sm">No recipients</p>
              )}
            </CardContent>
          </Card>
          
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
