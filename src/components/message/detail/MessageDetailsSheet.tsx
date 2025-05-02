
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Message } from "@/types/message";
import { ShieldOff, Shield, Clock, Bell, Mail, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { MessageTypeIcon } from "./MessageTypeIcon";
import { StatusBadge } from "@/components/ui/status-badge";
import { ReminderHistoryDialog } from "./ReminderHistoryDialog";
import { useNavigate } from "react-router-dom";
 
interface MessageDetailsSheetProps {
  showDetailsSheet: boolean;
  setShowDetailsSheet: (open: boolean) => void;
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
  const [reminderHistoryOpen, setReminderHistoryOpen] = useState(false);
  const navigate = useNavigate();
  
  return (
    <>
      <Sheet open={showDetailsSheet} onOpenChange={setShowDetailsSheet}>
        <SheetContent className="pt-10">
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <MessageTypeIcon messageType={message.message_type} />
              <div>
                <h2 className="text-lg font-medium">{message.title}</h2>
                <p className="text-sm text-muted-foreground">
                  Created {formatDate(message.created_at)}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <StatusBadge status={isArmed ? "armed" : "disarmed"}>
                  {isArmed ? "Armed" : "Disarmed"}
                </StatusBadge>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Type:</span>
                <span className="text-sm font-medium">{renderConditionType()}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Recipients:</h3>
              {renderRecipients()}
            </div>
            
            <div className="space-y-3">
              {/* Arm/Disarm Button - FIRST */}
              {conditionId && (
                <Button 
                  variant={isArmed ? "destructive" : "default"}
                  className="w-full"
                  onClick={isArmed ? handleDisarmMessage : handleArmMessage}
                  disabled={isActionLoading}
                >
                  {isArmed ? (
                    <>
                      <ShieldOff className="h-4 w-4 mr-2" />
                      Disarm Message
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Arm Message
                    </>
                  )}
                </Button>
              )}
              
              {/* Reminders Button - SECOND */}
              {conditionId && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setReminderHistoryOpen(true)}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  View Reminder History
                </Button>
              )}
              
              {/* Send Test Message Button - THIRD */}
              {conditionId && onSendTestMessage && recipients && recipients.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={onSendTestMessage}
                  disabled={isArmed || isActionLoading}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Test Message
                </Button>
              )}
              
              {/* Edit Message Button - FOURTH */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/message/${message.id}/edit`)}
                disabled={isArmed || isActionLoading}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Message
              </Button>
              
              {/* Delete Message Button - FIFTH */}
              <Button
                variant="outline"
                className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => navigate('/messages')}
                disabled={isArmed || isActionLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Message
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      {conditionId && (
        <ReminderHistoryDialog
          open={reminderHistoryOpen}
          onOpenChange={setReminderHistoryOpen}
          messageId={message.id}
        />
      )}
    </>
  );
}
