
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
      <div className="space-y-5 my-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            required
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium">WhatsApp Details (Highly Recommended)</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 234 567 8900"
            className="h-11"
          />
          <p className="text-xs text-muted-foreground">
            WhatsApp number with country code (e.g., +1 for USA, +44 for UK)
          </p>
        </div>
        <div className="flex items-start space-x-3 pt-2">
          <Switch 
            id="notify-toggle" 
            checked={notifyOnAdd} 
            onCheckedChange={setNotifyOnAdd}
            className={HOVER_TRANSITION}
          />
          <div className="flex-1">
            <Label htmlFor="notify-toggle" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
              Send welcome email when added to messages
            </Label>
          </div>
        </div>
      </div>
      <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
        <Button variant="outline" type="button" onClick={onCancel} className="w-full sm:w-auto h-11">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto h-11">
          {submitText}
        </Button>
      </DialogFooter>
    </form>
  );
}
