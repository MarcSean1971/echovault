
import React, { useState } from "react";
import { MessageRecipientsList } from "../MessageRecipientsList";
import { AccordionSection } from "../AccordionSection";
import { Users } from "lucide-react";

interface RecipientsSectionProps {
  recipients: any[];
  isArmed: boolean;
  isActionLoading: boolean;
  onSendTestMessage: () => void;
  renderRecipients?: () => React.ReactNode;
}

export function RecipientsSection({
  recipients,
  isArmed,
  isActionLoading,
  onSendTestMessage,
  renderRecipients
}: RecipientsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!recipients || recipients.length === 0) {
    return null;
  }
  
  return (
    <AccordionSection
      title={
        <div className="flex items-center gap-2 w-full">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>Recipients ({recipients.length})</span>
        </div>
      }
      defaultOpen={isOpen}
      value="recipients"
    >
      {renderRecipients ? renderRecipients() : <MessageRecipientsList recipients={recipients} />}
    </AccordionSection>
  );
}
