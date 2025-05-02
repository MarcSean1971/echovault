
import { Button } from "@/components/ui/button";
import { Recipient } from "@/types/message";
import { Edit, Trash, User } from "lucide-react";

interface RecipientCardProps {
  recipient: Recipient;
  onEdit: (recipient: Recipient) => void;
  onDelete: (id: string) => void;
}

export function RecipientCard({ recipient, onEdit, onDelete }: RecipientCardProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-md">
      <div className="flex items-center space-x-4">
        <div className="bg-primary/10 p-2 rounded-full">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">{recipient.name}</p>
          <p className="text-sm text-muted-foreground">{recipient.email}</p>
          {recipient.phone && (
            <p className="text-sm text-muted-foreground">{recipient.phone}</p>
          )}
        </div>
      </div>
      <div className="flex space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(recipient)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(recipient.id)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
