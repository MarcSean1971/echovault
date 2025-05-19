
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
        <div key={recipient.id} className="flex items-center py-1 border-b last:border-0">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-2">
            {recipient.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-medium block">{recipient.name}</span>
            <span className="text-muted-foreground text-xs">
              {recipient.email}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
