
import { Button } from "@/components/ui/button";
import { Info, Edit, Trash2 } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";

interface MessageActionFooterProps {
  messageId: string;
  isArmed: boolean;
  conditionId: string | null;
  isActionLoading: boolean;
  handleArmMessage: () => Promise<void>;
  handleDisarmMessage: () => Promise<void>;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (show: boolean) => void;
  handleDelete: () => Promise<void>;
  onSendTestMessage?: () => void;
}

export function MessageActionFooter({
  messageId,
  isArmed,
  conditionId,
  isActionLoading,
  handleArmMessage,
  handleDisarmMessage,
  showDeleteConfirm,
  setShowDeleteConfirm,
  handleDelete,
  onSendTestMessage
}: MessageActionFooterProps) {
  const navigate = useNavigate();
  
  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t z-10 flex justify-center">
        <div className="flex gap-2 w-full max-w-md">
          <Button
            variant="outline"
            onClick={() => navigate(`/message/${messageId}/edit`)}
            disabled={isArmed}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>
          
          {onSendTestMessage && (
            <Button
              variant="outline"
              onClick={onSendTestMessage}
              disabled={isActionLoading}
              className="flex-1"
            >
              <Info className="h-4 w-4 mr-1" /> Test
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isArmed}
            className="text-destructive border-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
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
    </>
  );
}
