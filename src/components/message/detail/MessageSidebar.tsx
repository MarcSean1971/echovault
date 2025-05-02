
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Info, Users, Edit, Trash2, Mail } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Message } from "@/types/message";
import { SendTestMessageDialog } from "./SendTestMessageDialog";

interface MessageSidebarProps {
  message: Message;
  isArmed: boolean;
  conditionId: string | null;
  isActionLoading: boolean;
  formatDate: (dateString: string) => string;
  renderConditionType: () => string;
  renderRecipients: () => React.ReactNode;
  handleDisarmMessage: () => Promise<void>;
  handleArmMessage: () => Promise<void>;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (show: boolean) => void;
  handleDelete: () => Promise<void>;
  recipients?: { id: string; name: string; email: string }[];
}

export function MessageSidebar({
  message,
  isArmed,
  conditionId,
  isActionLoading,
  formatDate,
  renderConditionType,
  renderRecipients,
  handleDisarmMessage,
  handleArmMessage,
  showDeleteConfirm,
  setShowDeleteConfirm,
  handleDelete,
  recipients = []
}: MessageSidebarProps) {
  const navigate = useNavigate();
  const [showTestMessageDialog, setShowTestMessageDialog] = useState(false);

  return (
    <div className="col-span-full lg:col-span-4 lg:order-2 space-y-4">
      {/* Status Card */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-medium">Status</h3>
            <div className={`w-3 h-3 rounded-full ${isArmed ? 'bg-destructive' : 'bg-green-500'}`}></div>
          </div>
          
          <div className="space-y-2">
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
            <>
              <div className="h-px bg-border w-full"></div>
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
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Recipients Card */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Recipients</h3>
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          {renderRecipients()}
          
          {/* Add Test Message Button */}
          {recipients && recipients.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={() => setShowTestMessageDialog(true)}
              disabled={isArmed || isActionLoading}
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Test Message
            </Button>
          )}
        </CardContent>
      </Card>
      
      {/* Actions Card */}
      <Card>
        <CardContent className="p-4 space-y-2">
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
          
          <Sheet open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/80"
                disabled={isArmed}
                title={isArmed ? "Disarm message to delete" : "Delete Message"}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Message
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Delete Message</SheetTitle>
                <SheetDescription>
                  Are you sure you want to delete this message? This action cannot be undone.
                </SheetDescription>
              </SheetHeader>
              <SheetFooter className="flex flex-row justify-end gap-2 mt-6">
                <SheetClose asChild>
                  <Button variant="outline">Cancel</Button>
                </SheetClose>
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  className="hover:bg-destructive/90"
                >
                  Delete
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </CardContent>
      </Card>
      
      {/* Test Message Dialog */}
      <SendTestMessageDialog
        open={showTestMessageDialog}
        onOpenChange={setShowTestMessageDialog}
        messageTitle={message.title}
        recipients={recipients}
      />
    </div>
  );
}
