
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-md hover:shadow-md transition-shadow space-y-3 sm:space-y-0">
      <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
        <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm sm:text-base break-words">{recipient.name}</p>
          <p className="text-xs sm:text-sm text-muted-foreground break-all">{recipient.email}</p>
          {recipient.phone && (
            <p className="text-xs sm:text-sm text-muted-foreground">{recipient.phone}</p>
          )}
          <div className="mt-1.5 sm:mt-1">
            <Badge 
              variant={recipient.notify_on_add ? "default" : "secondary"}
              className="text-xs"
            >
              {recipient.notify_on_add ? "Notifications On" : "Notifications Off"}
            </Badge>
          </div>
        </div>
      </div>
      <div className="flex space-x-2 sm:ml-4 justify-end">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(recipient)}
          className={`${HOVER_TRANSITION} h-10 w-10 sm:h-9 sm:w-9`}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(recipient.id)}
          className={`${HOVER_TRANSITION} h-10 w-10 sm:h-9 sm:w-9`}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
