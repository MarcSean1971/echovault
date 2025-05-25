
import { useState, useEffect } from "react";
import { fetchRecipients, createRecipient } from "@/services/messages/recipientService";
import { Recipient } from "@/types/message";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { RecipientSelectorHeader } from "./RecipientSelectorComponents/RecipientSelectorHeader";
import { RecipientBadges } from "./RecipientSelectorComponents/RecipientBadges";
import { RecipientDropdown } from "./RecipientSelectorComponents/RecipientDropdown";
import { AddRecipientDialog } from "./RecipientSelectorComponents/AddRecipientDialog";

interface RecipientSelectorProps {
  selectedRecipients: string[];
  onSelectRecipient: (recipientId: string) => void;
}

export function RecipientSelector({ selectedRecipients, onSelectRecipient }: RecipientSelectorProps) {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isAddingRecipient, setIsAddingRecipient] = useState(false);
  
  const { userId } = useAuth();

  // Load recipients on mount
  useEffect(() => {
    const loadRecipients = async () => {
      setIsLoading(true);
      try {
        const data = await fetchRecipients();
        setRecipients(data);
      } catch (error: any) {
        console.error("Failed to load recipients:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to load recipients",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRecipients();
  }, []);

  // Handle adding a new recipient
  const handleAddRecipient = async (name: string, email: string, phone: string) => {
    if (!userId) {
      toast({
        title: "Authentication error",
        description: "You must be signed in to add recipients",
        variant: "destructive"
      });
      return;
    }
    
    setIsAddingRecipient(true);

    try {
      const newRecipient = await createRecipient(
        userId,
        name,
        email,
        phone || undefined
      );
      
      setRecipients(prevRecipients => [...prevRecipients, newRecipient]);
      
      // Auto-select the newly created recipient
      onSelectRecipient(newRecipient.id);
      
      toast({
        title: "Recipient added",
        description: `${name} has been added to your recipients`
      });
      
      setDialogOpen(false);
    } catch (error: any) {
      console.error("Error adding recipient:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add recipient",
        variant: "destructive"
      });
    } finally {
      setIsAddingRecipient(false);
    }
  };

  // Get selected recipients as objects
  const selectedRecipientObjects = recipients.filter(recipient => 
    selectedRecipients.includes(recipient.id)
  );

  return (
    <div className="space-y-4">
      <RecipientSelectorHeader onAddNew={() => setDialogOpen(true)} />
      
      <RecipientBadges 
        selectedRecipientObjects={selectedRecipientObjects}
        onRemoveRecipient={onSelectRecipient}
      />

      <RecipientDropdown
        open={open}
        setOpen={setOpen}
        recipients={recipients}
        selectedRecipients={selectedRecipients}
        isLoading={isLoading}
        onSelectRecipient={onSelectRecipient}
        onAddNew={() => setDialogOpen(true)}
      />
      
      <AddRecipientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleAddRecipient}
        isLoading={isAddingRecipient}
      />
    </div>
  );
}
