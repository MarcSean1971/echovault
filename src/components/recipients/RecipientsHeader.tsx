
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { RecipientForm } from "./RecipientForm";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface RecipientsHeaderProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (isOpen: boolean) => void;
  onAddRecipient: (name: string, email: string, phone: string) => Promise<void>;
  isLoading: boolean;
}

export function RecipientsHeader({
  isDialogOpen,
  setIsDialogOpen,
  onAddRecipient,
  isLoading
}: RecipientsHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-3xl font-bold">Trusted Recipients</h1>
      <div className="space-x-2">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className={HOVER_TRANSITION}>
              <Plus className="mr-2 h-4 w-4" /> Add Recipient
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Recipient</DialogTitle>
            </DialogHeader>
            <RecipientForm 
              onSubmit={onAddRecipient}
              isLoading={isLoading}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
