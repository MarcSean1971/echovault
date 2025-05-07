
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Bell, BellOff, Mail } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface MessageActionFooterProps {
  messageId: string;
  isArmed: boolean;
  isActionLoading: boolean;
  handleArmMessage: () => Promise<Date | null>; // Changed return type to match the hook
  handleDisarmMessage: () => Promise<void>;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (show: boolean) => void;
  handleDelete: () => Promise<void>;
  onSendTestMessage?: () => void;
}

export function MessageActionFooter({
  messageId,
  isArmed,
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
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t z-10">
        <div className="flex gap-2 w-full max-w-3xl mx-auto">
          {isArmed ? (
            <Button
              variant="outline"
              onClick={handleDisarmMessage}
              disabled={isActionLoading}
              className="text-green-600 hover:bg-green-50 hover:text-green-700 flex-1 sm:flex-none"
            >
              <BellOff className={`h-4 w-4 mr-2 ${HOVER_TRANSITION}`} /> Disarm
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={handleArmMessage}
              disabled={isActionLoading}
              className="flex-1 sm:flex-none"
            >
              <Bell className={`h-4 w-4 mr-2 ${HOVER_TRANSITION}`} /> Arm
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={() => navigate(`/message/${messageId}/edit`)}
            disabled={isArmed || isActionLoading}
            className="sm:ml-auto"
          >
            <Edit className={`h-4 w-4 mr-1 sm:mr-2 ${HOVER_TRANSITION}`} /> <span className="hidden sm:inline">Edit</span>
          </Button>
          
          {onSendTestMessage && (
            <Button
              variant="outline"
              onClick={onSendTestMessage}
              disabled={isArmed || isActionLoading}
            >
              <Mail className={`h-4 w-4 mr-1 sm:mr-2 ${HOVER_TRANSITION}`} /> <span className="hidden sm:inline">Test</span>
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isArmed || isActionLoading}
            className="text-destructive border-destructive hover:bg-destructive/10"
          >
            <Trash2 className={`h-4 w-4 sm:mr-2 ${HOVER_TRANSITION}`} /> <span className="hidden sm:inline">Delete</span>
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
