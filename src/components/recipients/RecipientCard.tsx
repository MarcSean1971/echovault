
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Recipient } from "@/types/message";
import { Edit, Trash, User } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface RecipientCardProps {
  recipient: Recipient;
  onEdit: (recipient: Recipient) => void;
  onDelete: (id: string) => void;
}

export function RecipientCard({ recipient, onEdit, onDelete }: RecipientCardProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-md hover:shadow-md transition-shadow">
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
          <div className="mt-1">
            <Badge 
              variant={recipient.notify_on_add ? "default" : "secondary"}
              className="text-xs"
            >
              {recipient.notify_on_add ? "Notifications On" : "Notifications Off"}
            </Badge>
          </div>
        </div>
      </div>
      <div className="flex space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(recipient)}
          className={HOVER_TRANSITION}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(recipient.id)}
          className={HOVER_TRANSITION}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
