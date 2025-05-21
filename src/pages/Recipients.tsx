
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchRecipients, createRecipient, deleteRecipient, updateRecipient } from "@/services/messages/recipientService";
import { Recipient } from "@/types/message";
import { RecipientForm } from "@/components/recipients/RecipientForm";
import { RecipientsList } from "@/components/recipients/RecipientsList";

export default function Recipients() {
  const { userId, isSignedIn } = useAuth();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // Edit specific states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editRecipient, setEditRecipient] = useState<Recipient | null>(null);

  // Update authentication status when auth state changes
  useEffect(() => {
    if (isSignedIn) {
      console.log("User is signed in, userId:", userId);
    } else {
      console.log("User is not signed in");
    }
  }, [isSignedIn, userId]);

  // Fetch recipients on component mount
  useEffect(() => {
    if (!userId) return;
    
    const loadRecipients = async () => {
      setIsInitialLoading(true);
      try {
        const data = await fetchRecipients();
        setRecipients(data);
      } catch (error: any) {
        console.error("Failed to load recipients:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to load your recipients",
          variant: "destructive"
        });
      } finally {
        setIsInitialLoading(false);
      }
    };
    
    loadRecipients();
  }, [userId]);

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
      setRecipients(recipients.filter(recipient => recipient.id !== id));
      
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Trusted Recipients</h1>
          <div className="space-x-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Recipient
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Recipient</DialogTitle>
                </DialogHeader>
                <RecipientForm 
                  onSubmit={handleAddRecipient}
                  isLoading={isLoading}
                  onCancel={() => setIsDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Edit Recipient Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Recipient</DialogTitle>
            </DialogHeader>
            <RecipientForm 
              initialData={editRecipient}
              onSubmit={handleEditRecipient}
              isLoading={isLoading}
              onCancel={handleCloseEditDialog}
            />
          </DialogContent>
        </Dialog>

        <RecipientsList
          recipients={recipients}
          isLoading={isInitialLoading}
          onEditRecipient={handleOpenEditDialog}
          onRemoveRecipient={handleRemoveRecipient}
        />
      </div>
    </div>
  );
}
