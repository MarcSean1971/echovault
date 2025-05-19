
import React from "react";
import { Users } from "lucide-react";
import { MessageRecipientsList } from "../MessageRecipientsList";
import { HOVER_TRANSITION, ICON_HOVER_EFFECTS } from "@/utils/hoverEffects";
import { AccordionSection } from "@/components/message/detail/AccordionSection";

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
  if (!recipients || recipients.length === 0) {
    return null;
  }
  
  return (
    <div>
      <AccordionSection
        title={
          <div className="flex items-center">
            <Users className={`h-4 w-4 mr-2 text-muted-foreground ${ICON_HOVER_EFFECTS.default}`} />
            <h3 className="text-sm font-medium text-muted-foreground">Recipients</h3>
          </div>
        }
        defaultOpen={true}
      >
        {/* Use renderRecipients function if provided, otherwise use default MessageRecipientsList */}
        {renderRecipients ? renderRecipients() : <MessageRecipientsList recipients={recipients} />}
      </AccordionSection>
    </div>
  );
}
