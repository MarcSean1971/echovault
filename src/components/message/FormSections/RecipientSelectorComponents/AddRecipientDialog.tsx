
import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface AddRecipientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, email: string, phone: string) => Promise<void>;
  isLoading: boolean;
}

export function AddRecipientDialog({ open, onOpenChange, onSubmit, isLoading }: AddRecipientDialogProps) {
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(newName, newEmail, newPhone);
    
    // Reset form
    setNewName("");
    setNewEmail("");
    setNewPhone("");
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form when closing
    setNewName("");
    setNewEmail("");
    setNewPhone("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
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
              <Label htmlFor="phone">WhatsApp Details (Highly Recommended)</Label>
              <Input
                id="phone"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+1 234 567 8900"
              />
              <p className="text-xs text-muted-foreground">
                WhatsApp number with country code (e.g., +1 for USA, +44 for UK)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Recipient"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
