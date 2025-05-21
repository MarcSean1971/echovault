
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
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Recipients</h1>
        <p className="text-muted-foreground">
          Manage the people who will receive your messages.
        </p>
      </div>
      
      <Button 
        onClick={() => setIsDialogOpen(true)} 
        className="mt-4 sm:mt-0"
      >
        <UserPlus className="h-4 w-4 mr-2" /> Add Recipient
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Recipient</DialogTitle>
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
