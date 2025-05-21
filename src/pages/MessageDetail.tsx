import { useParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageLoading } from "@/components/message/detail/MessageLoading";
import { MessageNotFound } from "@/components/message/detail/MessageNotFound";
import { formatDate, getConditionType } from "@/utils/messageHelpers";
import { useMessageDetail } from "@/hooks/useMessageDetail";
import { MessageRecipientProvider } from "@/components/message/detail/MessageRecipientProvider";
import { useMessageActions } from "@/hooks/useMessageActions";
import { useMessageDeliveryStatus } from "@/hooks/useMessageDeliveryStatus";
import { triggerDeadmanSwitch } from "@/services/messages/whatsApp";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, FileText, Trash2, Users } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MessageContent } from "@/components/message/detail/MessageContent";

export default function MessageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Use memoized callback for error navigation
  const handleError = useCallback(() => {
    toast({
      title: "Error",
      description: "Could not load message details",
      variant: "destructive"
    });
    navigate("/messages");
  }, [navigate]);
  
  // Get minimal message data first for immediate display - show UI ASAP
  const { 
    message, 
    isLoading, 
    isArmed, 
    deadline, 
    conditionId, 
    condition, 
    recipients,
    setIsArmed,
    lastCheckIn,
    refreshCount
  } = useMessageDetail(id, handleError);
  
  // Get message delivery status - loads independently
  const { isDelivered, lastDelivered, viewCount, isLoading: isLoadingDelivery } = useMessageDeliveryStatus(id || '');
  
  // Use our custom hook for message actions
  const {
    isActionLoading,
    showSendTestDialog,
    setShowSendTestDialog,
    handleDelete,
    onArmMessage,
    onDisarmMessage,
    onSendTestMessage,
    handleSendTestMessages
  } = useMessageActions(id, conditionId, setIsArmed);
  
  // Get the recipient rendering function
  const { renderRecipients } = MessageRecipientProvider({ recipients });
  
  // Set up event listeners for conditions and deadline
  useEffect(() => {
    // Listen for condition updates to refresh data
    const handleConditionUpdated = () => {
      console.log('[MessageDetail] Condition updated event received');
    };
    
    window.addEventListener('conditions-updated', handleConditionUpdated);
    
    // Listen for deadline reached event
    const handleDeadlineReached = (event: Event) => {
      if (!id || !isArmed) return;
      
      // Check if this is a deadman's switch
      if (condition && condition.condition_type === 'no_check_in') {
        console.log('[MessageDetail] Deadline reached event received');
        
        // Attempt automatic delivery
        triggerDeadmanSwitch(id).catch(error => {
          console.error('[MessageDetail] Failed to trigger deadman switch:', error);
        });
      }
    };
    
    window.addEventListener('deadline-reached', handleDeadlineReached);
    
    return () => {
      window.removeEventListener('conditions-updated', handleConditionUpdated);
      window.removeEventListener('deadline-reached', handleDeadlineReached);
    };
  }, [id, isArmed, condition]);
  
  // Show minimal loading state just for a brief moment
  if (isLoading && !message) {
    return <MessageLoading message="Loading message..." />;
  }

  if (!message) {
    return <MessageNotFound />;
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 sm:px-6 py-8">
      {/* Back button outside the card */}
      <Button 
        variant="ghost" 
        onClick={() => navigate("/messages")}
        className={`mb-4 hover:bg-muted/80 hover:text-foreground ${HOVER_TRANSITION}`}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Messages
      </Button>
      
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Message Details</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Message title and details */}
          <div>
            <div className="flex items-center mb-4">
              <FileText className="h-5 w-5 mr-2" />
              <h2 className="text-xl font-medium">{message.title}</h2>
            </div>
            
            <div className="text-sm text-muted-foreground mb-4">
              <p>Created: {formatDate(message.created_at)}</p>
              {message.updated_at !== message.created_at && (
                <p>Last updated: {formatDate(message.updated_at)}</p>
              )}
            </div>
            
            {/* Status Badge */}
            <div className="flex items-center mb-4">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                isArmed ? 'bg-destructive/20 text-destructive' : 'bg-green-100 text-green-800'
              }`}>
                {isArmed ? 'Armed' : 'Disarmed'}
              </span>
              
              {/* Arm/Disarm Button */}
              {isArmed ? (
                <Button
                  variant="outline"
                  onClick={onDisarmMessage}
                  disabled={isActionLoading}
                  className={`ml-2 text-green-600 hover:bg-green-100 hover:text-green-700 ${HOVER_TRANSITION}`}
                  size="sm"
                >
                  Disarm
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={onArmMessage}
                  disabled={isActionLoading}
                  className={`ml-2 text-destructive hover:bg-destructive/20 hover:text-destructive border-destructive ${HOVER_TRANSITION}`}
                  size="sm"
                >
                  Arm
                </Button>
              )}
            </div>
            
            {/* Message content */}
            <Card className="overflow-hidden border border-border/50 shadow-sm mb-6">
              <CardContent className="p-4">
                <MessageContent 
                  message={message} 
                  deliveryId={null} 
                  recipientEmail={null} 
                />
              </CardContent>
            </Card>
          </div>
          
          <Separator />
          
          {/* Delivery Settings */}
          <div>
            <div className="flex items-center mb-4">
              <FileText className="h-5 w-5 mr-2" />
              <h2 className="text-xl font-medium">Trigger Settings</h2>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Trigger Type</p>
                  <p className="text-sm">{condition ? getConditionType(condition) : 'None'}</p>
                </div>
                {condition?.condition_type === 'no_check_in' && (
                  <div>
                    <p className="text-sm font-medium">Check-In Code</p>
                    <p className="text-sm font-mono bg-gray-50 p-2 rounded">{condition?.check_in_code || 'None'}</p>
                  </div>
                )}
                {deadline && (
                  <div>
                    <p className="text-sm font-medium">Deadline</p>
                    <p className="text-sm">{formatDate(deadline.toISOString())}</p>
                  </div>
                )}
                {lastDelivered && (
                  <div>
                    <p className="text-sm font-medium">Last Delivered</p>
                    <p className="text-sm">{formatDate(lastDelivered)}</p>
                  </div>
                )}
                {lastCheckIn && (
                  <div>
                    <p className="text-sm font-medium">Last Check-In</p>
                    <p className="text-sm">{formatDate(lastCheckIn)}</p>
                  </div>
                )}
                {viewCount !== null && (
                  <div>
                    <p className="text-sm font-medium">View Count</p>
                    <p className="text-sm">{viewCount}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Recipients */}
          <div>
            <div className="flex items-center mb-4">
              <Users className="h-5 w-5 mr-2" />
              <h2 className="text-xl font-medium">Recipients</h2>
            </div>
            
            <div className="space-y-2">
              {recipients && recipients.length > 0 ? (
                <div className="space-y-2">
                  {recipients.map((recipient) => (
                    <div key={recipient.id} className="p-3 border rounded-md flex justify-between items-center">
                      <div>
                        <div className="font-medium">{recipient.name}</div>
                        <div className="text-sm text-muted-foreground">{recipient.email}</div>
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    onClick={onSendTestMessage}
                    disabled={isArmed || isActionLoading}
                    className={`mt-2 ${HOVER_TRANSITION}`}
                    size="sm"
                  >
                    Send Test Message
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recipients configured.</p>
              )}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end gap-3 pt-6 border-t">
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
        </CardFooter>
      </Card>
      
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
