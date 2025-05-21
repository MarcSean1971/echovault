
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { Recipient } from "@/types/message";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface RecipientFormProps {
  initialData?: Recipient | null;
  onSubmit: (name: string, email: string, phone: string, notifyOnAdd: boolean) => Promise<void>;
  isLoading: boolean;
  onCancel: () => void;
}

export function RecipientForm({ initialData, onSubmit, isLoading, onCancel }: RecipientFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notifyOnAdd, setNotifyOnAdd] = useState(true);

  // Load initial data if provided (for editing)
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setEmail(initialData.email);
      setPhone(initialData.phone || "");
      setNotifyOnAdd(initialData.notify_on_add !== false); // Default to true if undefined
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(name, email, phone, notifyOnAdd);
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
        <div className="flex items-center space-x-2 pt-2">
          <Switch 
            id="notify-toggle" 
            checked={notifyOnAdd} 
            onCheckedChange={setNotifyOnAdd}
            className={HOVER_TRANSITION}
          />
          <Label htmlFor="notify-toggle" className="text-sm text-muted-foreground cursor-pointer">
            Send welcome email when added to messages
          </Label>
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
