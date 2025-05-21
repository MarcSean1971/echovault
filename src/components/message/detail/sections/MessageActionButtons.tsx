
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { 
  Sheet, 
  SheetClose, 
  SheetContent, 
  SheetDescription, 
  SheetFooter, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";

interface MessageActionButtonsProps {
  messageId: string;
  isArmed: boolean;
  isActionLoading: boolean;
  handleDelete: () => Promise<void>;
}

export function MessageActionButtons({
  messageId,
  isArmed,
  isActionLoading,
  handleDelete
}: MessageActionButtonsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <Card className="overflow-hidden border border-border/50 shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(`/message/${messageId}/edit`)}
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
          </div>
        </CardContent>
      </Card>
      
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
