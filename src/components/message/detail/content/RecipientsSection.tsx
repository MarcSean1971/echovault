
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Recipient } from "@/types/message";

interface RecipientsSectionProps {
  recipients: Recipient[];
  renderRecipients?: () => React.ReactNode; // Changed from expecting a function with parameters to no-param function
}

export function RecipientsSection({ recipients, renderRecipients }: RecipientsSectionProps) {
  if (!recipients || recipients.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">No recipients selected</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-medium text-lg mb-4">Recipients</h3>
        {renderRecipients ? (
          renderRecipients()
        ) : (
          <div className="space-y-2">
            {recipients.map((recipient) => (
              <div key={recipient.id} className="flex items-center py-2 border-b last:border-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3">
                  {recipient.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="font-medium block">{recipient.name}</span>
                  <span className="text-muted-foreground text-xs">{recipient.email}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
