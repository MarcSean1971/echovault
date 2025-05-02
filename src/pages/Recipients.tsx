
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { Plus, Trash, User, Edit } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchRecipients, createRecipient, deleteRecipient, updateRecipient } from "@/services/messages/recipientService";
import { Recipient } from "@/types/message";

export default function Recipients() {
  const { userId, isSignedIn } = useAuth();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  
  // Add/Edit form states
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
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

  const handleAddRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
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
        newName,
        newEmail,
        newPhone || undefined
      );
      
      setRecipients(prevRecipients => [...prevRecipients, newRecipient]);
      
      toast({
        title: "Recipient added",
        description: `${newName} has been added to your recipients`
      });
      
      setNewName("");
      setNewEmail("");
      setNewPhone("");
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

  const handleEditRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRecipient || !userId) return;
    
    setIsLoading(true);

    try {
      const updatedRecipient = await updateRecipient(editRecipient.id, {
        name: newName,
        email: newEmail,
        phone: newPhone || undefined
      });
      
      setRecipients(prevRecipients => 
        prevRecipients.map(recipient => 
          recipient.id === updatedRecipient.id ? updatedRecipient : recipient
        )
      );
      
      toast({
        title: "Recipient updated",
        description: `${newName} has been updated successfully`
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
    setNewName(recipient.name);
    setNewEmail(recipient.email);
    setNewPhone(recipient.phone || "");
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditRecipient(null);
    setNewName("");
    setNewEmail("");
    setNewPhone("");
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
              <form onSubmit={handleAddRecipient}>
                <DialogHeader>
                  <DialogTitle>Add New Recipient</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 my-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <Input
                      id="phone"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="555-1234"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Adding..." : "Add Recipient"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Recipient Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleEditRecipient}>
            <DialogHeader>
              <DialogTitle>Edit Recipient</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 my-6">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone Number (Optional)</Label>
                <Input
                  id="edit-phone"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="555-1234"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={handleCloseEditDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Recipient"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Your Trusted Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          {isInitialLoading ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">Loading recipients...</p>
            </div>
          ) : recipients.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">You haven't added any recipients yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recipients.map((recipient) => (
                <div key={recipient.id} className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{recipient.name}</p>
                      <p className="text-sm text-muted-foreground">{recipient.email}</p>
                      {recipient.phone && (
                        <p className="text-sm text-muted-foreground">{recipient.phone}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEditDialog(recipient)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveRecipient(recipient.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
