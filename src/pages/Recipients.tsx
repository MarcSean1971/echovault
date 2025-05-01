
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Plus, Trash, User } from "lucide-react";

interface Recipient {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export default function Recipients() {
  const navigate = useNavigate();
  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: "1", name: "John Doe", email: "john@example.com", phone: "555-1234" },
    { id: "2", name: "Jane Smith", email: "jane@example.com" }
  ]);
  
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Will be implemented with Supabase
      const newRecipient: Recipient = {
        id: Date.now().toString(),
        name: newName,
        email: newEmail,
        phone: newPhone || undefined
      };
      
      setRecipients([...recipients, newRecipient]);
      
      toast({
        title: "Recipient added",
        description: `${newName} has been added to your recipients`
      });
      
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem adding the recipient",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveRecipient = (id: string) => {
    setRecipients(recipients.filter(recipient => recipient.id !== id));
    toast({
      title: "Recipient removed",
      description: "The recipient has been removed from your list"
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Trusted Recipients</h1>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
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

      <Card>
        <CardHeader>
          <CardTitle>Your Trusted Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          {recipients.length === 0 ? (
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveRecipient(recipient.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
