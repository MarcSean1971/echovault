
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface RecipientSelectorProps {
  recipients: { id: string; name: string; email: string }[];
  selectedRecipients: string[];
  setSelectedRecipients: (selected: string[]) => void;
}

export function RecipientSelector({ 
  recipients, 
  selectedRecipients, 
  setSelectedRecipients 
}: RecipientSelectorProps) {
  // Function to select/deselect all recipients
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRecipients(recipients.map(r => r.id));
    } else {
      setSelectedRecipients([]);
    }
  };

  // Function to toggle selection of a single recipient
  const handleToggleRecipient = (recipientId: string) => {
    if (selectedRecipients.includes(recipientId)) {
      setSelectedRecipients(selectedRecipients.filter(id => id !== recipientId));
    } else {
      setSelectedRecipients([...selectedRecipients, recipientId]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="select-all" 
          checked={selectedRecipients.length === recipients.length && recipients.length > 0} 
          onCheckedChange={handleSelectAll}
        />
        <Label htmlFor="select-all" className="font-medium">
          Select all recipients
        </Label>
      </div>
      
      <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
        {recipients.map(recipient => (
          <div key={recipient.id} className="flex items-center space-x-2">
            <Checkbox 
              id={`recipient-${recipient.id}`} 
              checked={selectedRecipients.includes(recipient.id)}
              onCheckedChange={() => handleToggleRecipient(recipient.id)}
            />
            <Label htmlFor={`recipient-${recipient.id}`} className="flex-1">
              <span className="font-medium">{recipient.name}</span>
              <span className="text-sm text-muted-foreground ml-2">
                {recipient.email}
              </span>
            </Label>
          </div>
        ))}
        {recipients.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">
            No recipients available.
          </p>
        )}
      </div>
    </div>
  );
}
