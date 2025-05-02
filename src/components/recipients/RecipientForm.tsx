
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Recipient } from "@/types/message";

interface RecipientFormProps {
  initialData?: Recipient | null;
  onSubmit: (name: string, email: string, phone: string) => Promise<void>;
  isLoading: boolean;
  onCancel: () => void;
}

export function RecipientForm({ initialData, onSubmit, isLoading, onCancel }: RecipientFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Load initial data if provided (for editing)
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setEmail(initialData.email);
      setPhone(initialData.phone || "");
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(name, email, phone);
  };

  const isEditing = !!initialData;
  const submitText = isEditing 
    ? (isLoading ? "Updating..." : "Update Recipient") 
    : (isLoading ? "Adding..." : "Add Recipient");

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4 my-6">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number (Optional)</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="555-1234"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {submitText}
        </Button>
      </DialogFooter>
    </form>
  );
}
