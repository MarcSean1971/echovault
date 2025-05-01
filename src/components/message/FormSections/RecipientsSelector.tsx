
import { Recipient } from "@/types/message";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";

interface RecipientsSelectorProps {
  recipients: Recipient[];
  selectedRecipients: string[];
  onSelectRecipient: (id: string) => void;
  isLoading: boolean;
}

export function RecipientsSelector({
  recipients,
  selectedRecipients,
  onSelectRecipient,
  isLoading
}: RecipientsSelectorProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading recipients...</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="mb-2 block">Select Recipients</Label>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate("/recipients")}
        >
          <UserPlus className="h-4 w-4 mr-1" /> Add New
        </Button>
      </div>

      {recipients.length === 0 ? (
        <div className="text-sm text-muted-foreground py-2">
          No recipients found. Please add recipients first.
        </div>
      ) : (
        <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
          {recipients.map((recipient) => (
            <div 
              key={recipient.id} 
              className="flex items-center space-x-2 py-1"
            >
              <Checkbox 
                id={`recipient-${recipient.id}`} 
                checked={selectedRecipients.includes(recipient.id)}
                onCheckedChange={() => onSelectRecipient(recipient.id)}
              />
              <Label 
                htmlFor={`recipient-${recipient.id}`}
                className="cursor-pointer flex-1"
              >
                {recipient.name} ({recipient.email})
              </Label>
            </div>
          ))}
        </div>
      )}

      {recipients.length > 0 && selectedRecipients.length === 0 && (
        <p className="text-sm text-orange-500">
          Please select at least one recipient.
        </p>
      )}
    </div>
  );
}
