
import { MessageDetails } from "./MessageDetails";
import { DeadManSwitch } from "./DeadManSwitch";
import { RecipientSelector } from "./RecipientSelector";
import { Separator } from "@/components/ui/separator";
import { CardContent } from "@/components/ui/card";
import { FileText, Users } from "lucide-react";
import { Message } from "@/types/message";

interface EditMessageContentProps {
  message: Message;
  selectedRecipients: string[];
  handleToggleRecipient: (recipientId: string) => void;
}

export function EditMessageContent({ 
  message, 
  selectedRecipients, 
  handleToggleRecipient 
}: EditMessageContentProps) {
  return (
    <CardContent className="space-y-8">
      <div>
        <div className="flex items-center mb-4">
          <FileText className="h-5 w-5 mr-2" />
          <h2 className="text-xl font-medium">Message Content</h2>
        </div>
        <MessageDetails message={message} />
      </div>
      
      <Separator />
      
      <div>
        <DeadManSwitch />
      </div>
      
      <Separator />
      
      <div>
        <div className="flex items-center mb-4">
          <Users className="h-5 w-5 mr-2" />
          <h2 className="text-xl font-medium">Recipients</h2>
        </div>
        <div className="space-y-4">
          <p className="text-muted-foreground">Select who will receive this message if triggered.</p>
          
          <RecipientSelector 
            selectedRecipients={selectedRecipients}
            onSelectRecipient={handleToggleRecipient}
          />
        </div>
      </div>
    </CardContent>
  );
}
