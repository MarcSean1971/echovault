
import React from "react";
import { Users } from "lucide-react";
import { MessageRecipientsList } from "../MessageRecipientsList";
import { ICON_HOVER_EFFECTS } from "@/utils/hoverEffects";
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
    <AccordionSection
      title={
        <div className="flex items-center">
          <Users className={`h-4 w-4 mr-1.5 ${ICON_HOVER_EFFECTS.muted}`} />
          Recipients
        </div>
      }
      defaultOpen={true}
    >
      {/* Use renderRecipients function if provided, otherwise use default MessageRecipientsList */}
      {renderRecipients ? renderRecipients() : <MessageRecipientsList recipients={recipients} />}
    </AccordionSection>
  );
}
