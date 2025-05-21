
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RecipientForm } from "./RecipientForm";
import { Recipient } from "@/types/message";

interface EditRecipientDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  recipient: Recipient | null;
  onSubmit: (name: string, email: string, phone: string) => Promise<void>;
  isLoading: boolean;
  onCancel: () => void;
}

export function EditRecipientDialog({
  isOpen,
  onOpenChange,
  recipient,
  onSubmit,
  isLoading,
  onCancel
}: EditRecipientDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Recipient</DialogTitle>
        </DialogHeader>
        <RecipientForm 
          initialData={recipient}
          onSubmit={onSubmit}
          isLoading={isLoading}
          onCancel={onCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
