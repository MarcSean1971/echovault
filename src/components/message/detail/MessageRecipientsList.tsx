
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
    <div className="space-y-1">
      {recipients.map((recipient) => (
        <div key={recipient.id} className="p-2 border rounded-md flex justify-between items-center">
          <div>
            <div className="font-medium">{recipient.name}</div>
            <div className="text-sm text-muted-foreground">{recipient.email}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
