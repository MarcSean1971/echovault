
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Recipient } from "@/types/message";

interface RecipientBadgesProps {
  selectedRecipientObjects: Recipient[];
  onRemoveRecipient: (recipientId: string) => void;
}

export function RecipientBadges({ selectedRecipientObjects, onRemoveRecipient }: RecipientBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {selectedRecipientObjects.map(recipient => (
        <Badge key={recipient.id} variant="secondary" className="flex items-center gap-1 py-1 px-3">
          {recipient.name}
          <X 
            className="h-3 w-3 cursor-pointer" 
            onClick={() => onRemoveRecipient(recipient.id)}
          />
        </Badge>
      ))}
      {selectedRecipientObjects.length === 0 && (
        <p className="text-sm text-muted-foreground">No recipients selected</p>
      )}
    </div>
  );
}
