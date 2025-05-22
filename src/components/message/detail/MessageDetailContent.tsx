
import React from "react";
import { Message } from "@/types/message";
import { MessageLoading } from "./MessageLoading";
import { MessageNotFound } from "./MessageNotFound";
import { SendTestMessageDialog } from "./SendTestMessageDialog";
import { useSearchParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, Users, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { MessageContent } from "./content/message-content";
import { Label } from "@/components/ui/label";
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
  backButton
}: MessageDetailContentProps) {
  // Get delivery ID and recipient email from URL for attachment access
  const [searchParams] = useSearchParams();
  const deliveryId = searchParams.get('delivery');
  const recipientEmail = searchParams.get('recipient');

  // Full loading state is only displayed if we have no message at all
  if (!message) {
    return <MessageNotFound />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button at the left side, matching Edit page placement */}
      {backButton}
      
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>View Message Details</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={isArmed ? "armed" : "disarmed"} size="md">
                {isArmed ? "Armed" : "Disarmed"}
              </StatusBadge>
              
              {isArmed ? (
                <Button
                  variant="outline"
                  onClick={handleDisarmMessage}
                  disabled={isActionLoading}
                  className="text-green-600 hover:bg-green-100 hover:text-green-700"
                  size="sm"
                >
                  <BellOff className={`h-4 w-4 mr-2 ${HOVER_TRANSITION}`} /> Disarm
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleArmMessage}
                  disabled={isActionLoading}
                  className="text-purple-600 hover:bg-purple-100 hover:text-purple-700 border-purple-200"
                  size="sm"
                >
                  <Bell className={`h-4 w-4 mr-2 ${HOVER_TRANSITION}`} /> Arm
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-8">
            {/* Message Content Section */}
            <div>
              <div className="flex items-center mb-4">
                <FileText className="h-5 w-5 mr-2" />
                <h2 className="text-xl font-medium">Message Content</h2>
              </div>
              
              <Label htmlFor="message-title" className="block mb-1">Title</Label>
              <h2 id="message-title" className="text-xl font-medium mb-4">{message.title}</h2>
              
              <MessageContent 
                message={message} 
                deliveryId={deliveryId} 
                recipientEmail={recipientEmail} 
              />
            </div>
            
            <Separator />
            
            {/* Trigger Settings Section */}
            <div>
              <div className="flex items-center mb-4">
                <Bell className="h-5 w-5 mr-2" />
                <h2 className="text-xl font-medium">Trigger Settings</h2>
              </div>
              
              <div className="space-y-4">
                {condition && (
                  <>
                    <div>
                      <Label className="block mb-1">Condition Type</Label>
                      <p className="text-base">{renderConditionType()}</p>
                    </div>
                    
                    <div>
                      <Label className="block mb-1">Status</Label>
                      <p className="text-base">
                        {isArmed ? "Armed - Will trigger when conditions are met" : "Disarmed - Will not trigger"}
                      </p>
                    </div>
                    
                    {deadline && (
                      <div>
                        <Label className="block mb-1">Deadline</Label>
                        <p className="text-base">{deadline.toLocaleString()}</p>
                      </div>
                    )}
                    
                    {lastCheckIn && (
                      <div>
                        <Label className="block mb-1">Last Check-In</Label>
                        <p className="text-base">{formatDate(lastCheckIn)}</p>
                      </div>
                    )}
                    
                    {checkInCode && (
                      <div>
                        <Label className="block mb-1">Check-In Code</Label>
                        <p className="text-base font-mono bg-muted px-2 py-1 rounded inline-block">{checkInCode}</p>
                      </div>
                    )}
                    
                    {lastDelivered && (
                      <div>
                        <Label className="block mb-1">Last Delivered</Label>
                        <p className="text-base">{formatDate(lastDelivered)}</p>
                      </div>
                    )}
                    
                    {viewCount !== null && viewCount !== undefined && (
                      <div>
                        <Label className="block mb-1">View Count</Label>
                        <p className="text-base">{viewCount}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            
            <Separator />
            
            {/* Recipients Section */}
            <div>
              <div className="flex items-center mb-4">
                <Users className="h-5 w-5 mr-2" />
                <h2 className="text-xl font-medium">Recipients</h2>
              </div>
              
              <div className="space-y-4">
                <p className="text-muted-foreground">These people will receive this message when triggered.</p>
                
                {recipients.length === 0 ? (
                  <p className="text-muted-foreground italic">No recipients selected</p>
                ) : (
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
                
                {!isArmed && !isActionLoading && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={onSendTestMessage}
                  >
                    Send Test Message
                  </Button>
                )}
              </div>
            </div>
            
            <Separator />
            
            {/* Actions Section */}
            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className={`${HOVER_TRANSITION}`}
              >
                Back
              </Button>
              
              {!isArmed && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isActionLoading}
                >
                  Delete Message
                </Button>
              )}
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
    </div>
  );
}
