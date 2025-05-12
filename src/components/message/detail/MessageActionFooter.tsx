
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface MessageActionFooterProps {
  messageId: string;
  isArmed: boolean;
  isActionLoading: boolean;
  handleArmMessage: () => Promise<Date | null>; // Keeping the prop for compatibility
  handleDisarmMessage: () => Promise<void>; // Keeping the prop for compatibility
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (show: boolean) => void;
  handleDelete: () => Promise<void>;
  onSendTestMessage?: () => void; // Keeping the prop for compatibility but not using it in the render
}

export function MessageActionFooter({
  messageId,
  isArmed,
  isActionLoading,
  // handleArmMessage and handleDisarmMessage are kept for compatibility but not used anymore
  showDeleteConfirm,
  setShowDeleteConfirm,
  handleDelete,
  // onSendTestMessage prop is kept for compatibility but not used in rendering
}: MessageActionFooterProps) {
  const navigate = useNavigate();
  
  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t z-10">
        <div className="flex gap-2 w-full max-w-3xl mx-auto justify-end">
          <Button
            variant="outline"
            onClick={() => navigate(`/message/${messageId}/edit`)}
            disabled={isArmed || isActionLoading}
          >
            <Edit className={`h-4 w-4 mr-1 sm:mr-2 ${HOVER_TRANSITION}`} /> <span className="hidden sm:inline">Edit</span>
          </Button>
          
          {/* Test button removed as requested */}
          
          <Button
            variant="outline"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isArmed || isActionLoading}
            className="text-destructive border-destructive hover:bg-destructive/20 hover:text-destructive"
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
