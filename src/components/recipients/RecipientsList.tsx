
import { Card, CardContent } from "@/components/ui/card";
import { RecipientCard } from "./RecipientCard";
import { Recipient } from "@/types/message";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

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
    <Card className={HOVER_TRANSITION}>
      <CardContent className="pt-6">
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
