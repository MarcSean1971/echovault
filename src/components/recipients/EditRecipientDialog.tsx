
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RecipientForm } from "./RecipientForm";
import { Recipient } from "@/types/message";

interface EditRecipientDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, email: string, phone: string, notifyOnAdd: boolean) => Promise<void>;
  recipient: Recipient | null;
  isLoading: boolean;
  onCancel: () => void;
}

export function EditRecipientDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  recipient,
  isLoading,
  onCancel
}: EditRecipientDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {recipient ? "Edit" : "Add"} Recipient
          </DialogTitle>
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
