
import React from "react";

type Recipient = {
  id: string;
  name: string;
  email: string;
};

interface MessageRecipientsListProps {
  recipients: Recipient[];
}

export function MessageRecipientsList({ recipients }: MessageRecipientsListProps) {
  if (!recipients || recipients.length === 0) {
    return <p className="text-muted-foreground text-sm">No recipients</p>;
  }
  
  return (
    <div className="space-y-2">
      {recipients.map((recipient) => (
        <div key={recipient.id} className="flex items-center text-sm">
          <span className="font-medium">{recipient.name}</span>
          <span className="text-muted-foreground ml-2 text-xs">
            ({recipient.email})
          </span>
        </div>
      ))}
    </div>
  );
}
