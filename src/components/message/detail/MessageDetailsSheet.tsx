import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Message } from "@/types/message";
import { StatusCard } from "./sidebar/StatusCard";
import { RecipientsCard } from "./sidebar/RecipientsCard";
import { SendTestMessageDialog } from "./SendTestMessageDialog";

interface MessageDetailsSheetProps {
  showDetailsSheet: boolean;
  setShowDetailsSheet: (show: boolean) => void;
  formatDate: (dateString: string) => string;
  message: Message;
  renderRecipients: () => React.ReactNode;
  renderConditionType: () => string;
  isArmed: boolean;
  conditionId: string | null;
  isActionLoading: boolean;
  handleDisarmMessage: () => Promise<void>;
  handleArmMessage: () => Promise<void>;
  recipients?: any[];
  onSendTestMessage?: () => void;
}

export function MessageDetailsSheet({
  showDetailsSheet,
  setShowDetailsSheet,
  formatDate,
  message,
  renderRecipients,
  renderConditionType,
  isArmed,
  conditionId,
  isActionLoading,
  handleDisarmMessage,
  handleArmMessage,
  recipients = [],
  onSendTestMessage
}: MessageDetailsSheetProps) {
  const [showTestMessageDialog, setShowTestMessageDialog] = useState(false);

  const handleSendTestMessage = () => {
    if (onSendTestMessage) {
      onSendTestMessage();
    } else {
      setShowTestMessageDialog(true);
    }
  };

  return (
    <>
      <Sheet open={showDetailsSheet} onOpenChange={setShowDetailsSheet}>
        <SheetContent className="w-full pt-6 overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Message Details</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-4">
            <StatusCard
              isArmed={isArmed}
              message={message}
              conditionId={conditionId}
              isActionLoading={isActionLoading}
              formatDate={formatDate}
              renderConditionType={renderConditionType}
              handleDisarmMessage={handleDisarmMessage}
              handleArmMessage={handleArmMessage}
            />
            
            <RecipientsCard
              recipients={recipients}
              renderRecipients={renderRecipients}
              isArmed={isArmed}
              isActionLoading={isActionLoading}
              onSendTestMessage={handleSendTestMessage}
            />
          </div>
        </SheetContent>
      </Sheet>
      
      <SendTestMessageDialog
        open={showTestMessageDialog}
        onOpenChange={setShowTestMessageDialog}
        messageTitle={message.title}
        recipients={recipients}
      />
    </>
  );
}
