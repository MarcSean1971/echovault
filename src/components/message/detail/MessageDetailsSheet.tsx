
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CalendarDays, Info, Users, Edit, Trash2, Mail } from "lucide-react";
import { Message } from "@/types/message";
import { useNavigate } from "react-router-dom";
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
  recipients = []
}: MessageDetailsSheetProps) {
  const navigate = useNavigate();
  const [showTestMessageDialog, setShowTestMessageDialog] = useState(false);

  return (
    <>
      <Sheet open={showDetailsSheet} onOpenChange={setShowDetailsSheet}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Message Details</SheetTitle>
          </SheetHeader>
          
          <div className="py-4 space-y-5">
            {/* Status Section */}
            <div className="space-y-2">
              <h3 className="text-base font-medium flex items-center">
                <div className={`w-2 h-2 rounded-full ${isArmed ? 'bg-destructive' : 'bg-green-500'} mr-2`}></div>
                Status
              </h3>
              
              <div className="space-y-2 pl-4">
                <div className="flex items-center text-sm">
                  <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium mr-1">Created:</span> 
                  {formatDate(message.created_at)}
                </div>
                
                {message.updated_at !== message.created_at && (
                  <div className="flex items-center text-sm">
                    <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium mr-1">Updated:</span> 
                    {formatDate(message.updated_at)}
                  </div>
                )}
                
                <div className="flex items-center text-sm">
                  <Info className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium mr-1">Type:</span> 
                  {renderConditionType()}
                </div>
              </div>
              
              {conditionId && (
                <div className="pt-2">
                  {isArmed ? (
                    <Button
                      variant="outline"
                      onClick={handleDisarmMessage}
                      disabled={isActionLoading}
                      className="w-full text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-700"
                    >
                      Disarm Message
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={handleArmMessage}
                      disabled={isActionLoading}
                      className="w-full text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/80"
                    >
                      Arm Message
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            {/* Recipients Section */}
            <div className="space-y-2">
              <h3 className="text-base font-medium flex items-center">
                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                Recipients
              </h3>
              
              <div className="pl-4">
                {renderRecipients()}
                
                {recipients && recipients.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => {
                      setShowDetailsSheet(false);
                      setShowTestMessageDialog(true);
                    }}
                    disabled={isArmed || isActionLoading}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Test Message
                  </Button>
                )}
              </div>
            </div>
            
            {/* Actions Section */}
            <div className="space-y-2">
              <h3 className="text-base font-medium">Actions</h3>
              
              <Button
                variant="outline"
                className="w-full justify-start hover:bg-accent hover:text-accent-foreground"
                onClick={() => navigate(`/message/${message.id}/edit`)}
                disabled={isArmed}
                title={isArmed ? "Disarm message to edit" : "Edit Message"}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Message
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Test Message Dialog */}
      <SendTestMessageDialog
        open={showTestMessageDialog}
        onOpenChange={setShowTestMessageDialog}
        messageTitle={message.title}
        recipients={recipients}
      />
    </>
  );
}
