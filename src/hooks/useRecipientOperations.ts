
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { createRecipient, deleteRecipient, updateRecipient } from "@/services/messages/recipientService";
import { Recipient } from "@/types/message";

export function useRecipientOperations(setRecipients: React.Dispatch<React.SetStateAction<Recipient[]>>) {
  const { userId } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editRecipient, setEditRecipient] = useState<Recipient | null>(null);

  const handleAddRecipient = async (name: string, email: string, phone: string) => {
    if (!userId) {
      toast({
        title: "Authentication error",
        description: "You must be signed in to add recipients",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);

    try {
      console.log("Creating recipient for user:", userId);
      const newRecipient = await createRecipient(
        userId,
        name,
        email,
        phone || undefined
      );
      
      setRecipients(prevRecipients => [...prevRecipients, newRecipient]);
      
      toast({
        title: "Recipient added",
        description: `${name} has been added to your recipients`
      });
      
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Error adding recipient:", error);
      toast({
        title: "Error",
        description: error.message || "There was a problem adding the recipient",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRecipient = async (name: string, email: string, phone: string) => {
    if (!editRecipient || !userId) return;
    
    setIsLoading(true);

    try {
      const updatedRecipient = await updateRecipient(editRecipient.id, {
        name,
        email,
        phone: phone || undefined
      });
      
      setRecipients(prevRecipients => 
        prevRecipients.map(recipient => 
          recipient.id === updatedRecipient.id ? updatedRecipient : recipient
        )
      );
      
      toast({
        title: "Recipient updated",
        description: `${name} has been updated successfully`
      });
      
      setIsEditDialogOpen(false);
      setEditRecipient(null);
    } catch (error: any) {
      console.error("Error updating recipient:", error);
      toast({
        title: "Error",
        description: error.message || "There was a problem updating the recipient",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEditDialog = (recipient: Recipient) => {
    setEditRecipient(recipient);
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditRecipient(null);
  };

  const handleRemoveRecipient = async (id: string) => {
    try {
      await deleteRecipient(id);
      setRecipients(prev => prev.filter(recipient => recipient.id !== id));
      
      toast({
        title: "Recipient removed",
        description: "The recipient has been removed from your list"
      });
    } catch (error: any) {
      console.error("Error removing recipient:", error);
      toast({
        title: "Error",
        description: error.message || "There was a problem removing the recipient",
        variant: "destructive"
      });
    }
  };

  return {
    isLoading,
    isDialogOpen,
    setIsDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    editRecipient,
    handleAddRecipient,
    handleEditRecipient,
    handleOpenEditDialog,
    handleCloseEditDialog,
    handleRemoveRecipient
  };
}
