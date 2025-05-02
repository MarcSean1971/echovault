
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Info, Users, Edit, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";

interface MessageSidebarProps {
  message: any;
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
  handleDelete
}: MessageSidebarProps) {
  const navigate = useNavigate();
  
  return (
    <div className="lg:col-span-4 lg:order-2 space-y-4 hidden lg:block">
      {/* Status card */}
      <Card className={`${isArmed ? 'border-destructive border-2 shadow-md' : ''}`}>
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
                  className="w-full text-green-600 hover:bg-green-50 hover:text-green-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><path d="M6 10v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10M10 2h4a2 2 0 0 1 2 2v4H8V4a2 2 0 0 1 2-2Z"></path></svg>
                  Disarm Message
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleArmMessage}
                  disabled={isActionLoading}
                  className="w-full text-destructive hover:bg-destructive/10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><path d="M6 10v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10M10 2h4a2 2 0 0 1 2 2v4H8V4a2 2 0 0 1 2-2Z"></path></svg>
                  Arm Message
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Recipients card */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Recipients</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          {renderRecipients()}
        </CardContent>
      </Card>
      
      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          onClick={() => navigate(`/message/${message.id}/edit`)}
          disabled={isArmed}
          className="w-full justify-start"
          title={isArmed ? "Disarm message to edit" : "Edit"}
        >
          <Edit className="h-4 w-4 mr-2" /> Edit Message
        </Button>
        
        {/* Delete with confirmation */}
        <Sheet open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={isArmed}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete Message
            </Button>
          </SheetTrigger>
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
    </div>
  );
}
