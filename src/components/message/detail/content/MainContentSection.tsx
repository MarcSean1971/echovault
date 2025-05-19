
import React from "react";
import { Message } from "@/types/message";
import { StatusDeliverySection } from "./StatusDeliverySection";
import { RecipientsSection } from "./RecipientsSection";
import { MessageHeader } from "../MessageHeader";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MessageContent } from "../content/message-content";
import { Skeleton } from "@/components/ui/skeleton";

interface MainContentSectionProps {
  message: Message;
  isArmed: boolean;
  isActionLoading: boolean;
  condition: any | null;
  formatDate: (dateString: string) => string;
  renderConditionType: () => string;
  handleDisarmMessage: () => Promise<void>;
  handleArmMessage: () => Promise<Date | null>;
  deliveryId?: string | null;
  recipientEmail?: string | null;
  recipients: any[];
  onSendTestMessage: () => void;
  lastCheckIn?: string | null;
  checkInCode?: string | null;
  lastDelivered?: string | null;
  isDelivered?: boolean;
  viewCount?: number | null;
  isLoadingDelivery?: boolean;
  refreshTrigger?: number;
  deadline?: Date | null;
  isLoading?: boolean;
}

export function MainContentSection({
  message,
  isArmed,
  isActionLoading,
  condition,
  formatDate,
  renderConditionType,
  handleDisarmMessage,
  handleArmMessage,
  deliveryId,
  recipientEmail,
  recipients,
  onSendTestMessage,
  lastCheckIn,
  checkInCode,
  lastDelivered,
  isDelivered,
  viewCount,
  isLoadingDelivery,
  refreshTrigger,
  deadline,
  isLoading = false
}: MainContentSectionProps) {
  // Render everything immediately for better user experience
  return (
    <div className="space-y-6">
      {/* Message Header */}
      <MessageHeader
        message={message}
        isArmed={isArmed}
        isActionLoading={isActionLoading}
        handleDisarmMessage={handleDisarmMessage}
        handleArmMessage={handleArmMessage}
      />
      
      {/* Main Message Content Card */}
      <Card className="overflow-hidden border border-border/50 shadow-sm">
        <CardContent className="p-6">
          <MessageContent 
            message={message} 
            deliveryId={deliveryId} 
            recipientEmail={recipientEmail} 
          />
        </CardContent>
      </Card>
      
      {/* Status & Delivery Section */}
      <Card className="overflow-hidden border border-border/50 shadow-sm">
        <CardContent className="p-6">
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
      
      {/* Recipients Section */}
      <Card className="overflow-hidden border border-border/50 shadow-sm">
        <CardHeader className="px-6 pt-6 pb-3">
          <h3 className="text-lg font-medium">Recipients</h3>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {!recipients || recipients.length === 0 ? (
            <div className="text-muted-foreground">No recipients configured</div>
          ) : (
            <RecipientsSection
              recipients={recipients}
              isArmed={isArmed}
              isActionLoading={isActionLoading}
              onSendTestMessage={onSendTestMessage}
              renderRecipients={() => (
                <div className="space-y-2">
                  {recipients.map((recipient) => (
                    <div key={recipient.id} className="p-2 border rounded-md flex justify-between items-center">
                      <div>
                        <div className="font-medium">{recipient.name}</div>
                        <div className="text-sm text-muted-foreground">{recipient.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
