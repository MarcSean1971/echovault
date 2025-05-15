
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronLeft, Clock, ClipboardCheck, Mail, PanelRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Fragment, useState } from "react";
import { MessageBody } from "@/components/message/detail/content/MessageBody";
import { StatusDeliverySection } from "@/components/message/detail/content/status-delivery/StatusDeliverySection";
import { RecipientsSection } from "@/components/message/detail/content/RecipientsSection";
import { AttachmentsSection } from "@/components/message/detail/content/AttachmentsSection";
import { MessageDelete } from "@/components/message/MessageDelete";
import { TestMessage } from "@/components/message/TestMessage";
import { Recipient } from "@/types/message";
import { MobileTimerAlert } from "@/components/message/detail/MobileTimerAlert";
import { DesktopTimerAlert } from "@/components/message/detail/DesktopTimerAlert";
import { useIsMobile } from "@/hooks/use-mobile";
import { AutoDeliveryStatus } from "@/components/message/detail/content/AutoDeliveryStatus";

interface MessageDetailContentProps {
  message: any;
  isLoading: boolean;
  isArmed?: boolean;
  isActionLoading?: boolean;
  deadline?: Date | null;
  conditionId?: string | null;
  condition?: any | null;
  handleDisarmMessage?: () => void;
  handleArmMessage?: () => void;
  handleDelete?: () => Promise<void>;
  formatDate: (dateString: string) => string;
  renderConditionType: () => string;
  renderRecipients?: (recipients: Recipient[]) => JSX.Element[];
  recipients?: Recipient[];
  onSendTestMessage?: () => void;
  showSendTestDialog?: boolean;
  setShowSendTestDialog?: (show: boolean) => void;
  handleSendTestMessages?: () => Promise<void>;
  lastCheckIn?: string | null;
  checkInCode?: string | null;
  lastDelivered?: string | null;
  isDelivered?: boolean;
  viewCount?: number | null;
  isLoadingDelivery?: boolean;
  refreshTrigger?: number;
  handleForceDelivery?: () => Promise<void>;
}

export function MessageDetailContent({ 
  message,
  isLoading,
  isArmed = false,
  isActionLoading = false,
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
  isLoadingDelivery = false,
  refreshTrigger,
  handleForceDelivery
}: MessageDetailContentProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('message');

  const hasAttachments = message.attachments && message.attachments.length > 0;
  const isDeadmanSwitch = condition?.condition_type === 'no_check_in';
  
  return (
    <div className="pb-8">
      <div className="flex flex-col space-y-4">
        {/* Back button and badge */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button 
            variant="ghost" 
            className="p-0 h-8"
            onClick={() => navigate('/messages')}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> 
            <span>Back to Messages</span>
          </Button>
          
          <div className="flex items-center gap-2">
            {isArmed && (
              <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                <Clock className="h-3.5 w-3.5 mr-1" />
                Armed
              </Badge>
            )}
            
            <Badge 
              variant="outline" 
              className={cn(
                "capitalize",
                message.message_type === "text" ? "bg-blue-50 text-blue-600 border-blue-200" : 
                message.message_type === "video" ? "bg-purple-50 text-purple-600 border-purple-200" :
                "bg-slate-50 text-slate-600 border-slate-200"
              )}
            >
              {message.message_type || "text"}
            </Badge>
            
            {isDelivered && (
              <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                <Mail className="h-3.5 w-3.5 mr-1" />
                Delivered
              </Badge>
            )}
          </div>
        </div>
        
        {/* Mobile View Timer Alert */}
        {isMobile && isArmed && deadline && (
          <MobileTimerAlert 
            deadline={deadline} 
            isArmed={isArmed} 
            refreshTrigger={refreshTrigger}
            messageId={message.id} 
            onForceDelivery={handleForceDelivery}
          />
        )}
        
        {/* Message title */}
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold break-words">
            {message.title}
          </h1>
          <div className="text-sm text-muted-foreground mt-1">
            Created {formatDate(message.created_at)}
          </div>
        </div>
      </div>
      
      {/* Message content and details */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Message body */}
        <div className="lg:col-span-2 space-y-4">
          {/* Desktop tabs */}
          <div className="hidden sm:flex border-b space-x-4">
            <Button
              variant="ghost"
              className={cn(
                "px-2 relative h-9",
                activeTab === 'message' && "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary text-primary"
              )}
              onClick={() => setActiveTab('message')}
            >
              Message Content
            </Button>
            {recipients && recipients.length > 0 && (
              <Button
                variant="ghost"
                className={cn(
                  "px-2 relative h-9",
                  activeTab === 'recipients' && "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary text-primary"
                )}
                onClick={() => setActiveTab('recipients')}
              >
                Recipients
                {recipients.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {recipients.length}
                  </Badge>
                )}
              </Button>
            )}
            {hasAttachments && (
              <Button
                variant="ghost"
                className={cn(
                  "px-2 relative h-9",
                  activeTab === 'attachments' && "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary text-primary"
                )}
                onClick={() => setActiveTab('attachments')}
              >
                Attachments
                {hasAttachments && (
                  <Badge variant="secondary" className="ml-2">
                    {message.attachments.length}
                  </Badge>
                )}
              </Button>
            )}
          </div>
          
          {/* Mobile tabs */}
          <div className="sm:hidden flex overflow-x-auto space-x-2 pb-2">
            <Button
              size="sm"
              variant={activeTab === 'message' ? "default" : "outline"} 
              onClick={() => setActiveTab('message')}
              className={cn(
                activeTab === 'message' ? "bg-primary text-primary-foreground" : "bg-background"
              )}
            >
              Message
            </Button>
            {recipients && recipients.length > 0 && (
              <Button
                size="sm"
                variant={activeTab === 'recipients' ? "default" : "outline"} 
                onClick={() => setActiveTab('recipients')}
                className={cn(
                  activeTab === 'recipients' ? "bg-primary text-primary-foreground" : "bg-background"
                )}
              >
                Recipients ({recipients.length})
              </Button>
            )}
            {hasAttachments && (
              <Button
                size="sm"
                variant={activeTab === 'attachments' ? "default" : "outline"} 
                onClick={() => setActiveTab('attachments')}
                className={cn(
                  activeTab === 'attachments' ? "bg-primary text-primary-foreground" : "bg-background"
                )}
              >
                Attachments ({message.attachments.length})
              </Button>
            )}
          </div>
          
          {/* Tab content */}
          <div className="mt-4">
            {activeTab === 'message' && (
              <MessageBody message={message} />
            )}
            {activeTab === 'recipients' && recipients && (
              <RecipientsSection 
                recipients={recipients} 
                renderRecipients={renderRecipients}
              />
            )}
            {activeTab === 'attachments' && hasAttachments && (
              <AttachmentsSection attachments={message.attachments} />
            )}
          </div>
        </div>
        
        {/* Right column - Delivery and status */}
        <div className="space-y-6">
          {/* Desktop View Timer Alert */}
          {!isMobile && isArmed && deadline && (
            <DesktopTimerAlert 
              deadline={deadline} 
              isArmed={isArmed} 
              refreshTrigger={refreshTrigger}
            />
          )}
          
          {/* Auto delivery status */}
          <AutoDeliveryStatus 
            condition={condition}
            isArmed={isArmed}
            isDelivered={isDelivered}
            lastDelivered={lastDelivered}
          />
          
          {/* Delivery section */}
          <StatusDeliverySection 
            message={message}
            condition={condition}
            formatDate={formatDate}
            renderConditionType={renderConditionType}
            isArmed={isArmed}
            deadline={deadline}
            lastCheckIn={lastCheckIn}
            checkInCode={checkInCode}
            lastDelivered={lastDelivered}
            isDelivered={isDelivered}
            viewCount={viewCount}
            isLoadingDelivery={isLoadingDelivery}
            refreshTrigger={refreshTrigger}
            handleForceDelivery={handleForceDelivery}
          />
          
          {/* Action buttons */}
          <div className="flex flex-col space-y-2">
            {isArmed ? (
              <Button 
                variant="outline" 
                disabled={isActionLoading || !handleDisarmMessage}
                onClick={handleDisarmMessage}
                className="justify-start"
              >
                <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                Disarm Message
              </Button>
            ) : (
              <Button 
                disabled={isActionLoading || !handleArmMessage || isDelivered}
                onClick={handleArmMessage}
                className="justify-start"
              >
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Arm Message
              </Button>
            )}
            
            {onSendTestMessage && (
              <Button 
                variant="outline" 
                disabled={isActionLoading || !recipients || recipients.length === 0}
                onClick={onSendTestMessage}
                className="justify-start"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Test Message
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(true)}
              className="justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              disabled={isActionLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Message
            </Button>
          </div>
        </div>
      </div>

      {/* Delete dialog */}
      {handleDelete && (
        <MessageDelete
          isOpen={isDeleteDialogOpen} 
          onOpenChange={setIsDeleteDialogOpen}
          onDelete={handleDelete}
          isLoading={isActionLoading}
          messageTitle={message.title}
        />
      )}
      
      {/* Test message dialog */}
      {handleSendTestMessages && showSendTestDialog !== undefined && setShowSendTestDialog && (
        <TestMessage 
          isOpen={showSendTestDialog}
          onOpenChange={setShowSendTestDialog}
          onSendTest={handleSendTestMessages}
          isLoading={isActionLoading}
          messageTitle={message.title}
          recipientCount={recipients?.length || 0}
        />
      )}
    </div>
  );
}
