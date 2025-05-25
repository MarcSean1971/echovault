
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import { RecipientForm } from "./RecipientForm";

interface RecipientsHeaderProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  onAddRecipient: (name: string, email: string, phone: string, notifyOnAdd: boolean) => Promise<void>;
  isLoading: boolean;
}

export function RecipientsHeader({
  isDialogOpen,
  setIsDialogOpen,
  onAddRecipient,
  isLoading
}: RecipientsHeaderProps) {
  return (
    <div className="flex flex-col space-y-4 mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Recipients</h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-1">
            Manage the people who will receive your messages.
          </p>
        </div>
        
        <Button 
          onClick={() => setIsDialogOpen(true)} 
          className="w-full sm:w-auto h-11 sm:h-10"
        >
          <UserPlus className="h-4 w-4 mr-2" /> Add Recipient
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Add Recipient</DialogTitle>
          </DialogHeader>
          <RecipientForm
            onSubmit={onAddRecipient}
            isLoading={isLoading}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
