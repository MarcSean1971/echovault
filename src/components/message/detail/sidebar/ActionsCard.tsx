
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";

interface ActionsCardProps {
  messageId: string;
  isArmed: boolean;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (show: boolean) => void;
  handleDelete: () => Promise<void>;
}

export function ActionsCard({
  messageId,
  isArmed,
  showDeleteConfirm,
  setShowDeleteConfirm,
  handleDelete
}: ActionsCardProps) {
  const navigate = useNavigate();
  
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start hover:bg-accent hover:text-accent-foreground"
          onClick={() => navigate(`/message/${messageId}/edit`)}
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
  );
}
