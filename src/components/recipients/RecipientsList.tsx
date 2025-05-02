
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecipientCard } from "./RecipientCard";
import { Recipient } from "@/types/message";

interface RecipientsListProps {
  recipients: Recipient[];
  isLoading: boolean;
  onEditRecipient: (recipient: Recipient) => void;
  onRemoveRecipient: (id: string) => void;
}

export function RecipientsList({ 
  recipients, 
  isLoading, 
  onEditRecipient, 
  onRemoveRecipient 
}: RecipientsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Trusted Contacts</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">Loading recipients...</p>
          </div>
        ) : recipients.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">You haven't added any recipients yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recipients.map((recipient) => (
              <RecipientCard 
                key={recipient.id} 
                recipient={recipient} 
                onEdit={onEditRecipient} 
                onDelete={onRemoveRecipient}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
