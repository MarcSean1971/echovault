
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { RecipientForm } from "./RecipientForm";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  
  return (
    <div className="mb-8 animate-fade-in">
      <div className={`flex ${isMobile ? 'flex-col gap-4' : 'flex-row items-center justify-between'} mb-2`}>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">
            Trusted Recipients
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your trusted contacts for emergency notifications
          </p>
        </div>
        
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
    </div>
  );
}
