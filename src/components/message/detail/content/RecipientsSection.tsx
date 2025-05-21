
import React from "react";
import { MessageRecipientsList } from "../MessageRecipientsList";

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
    <>
      {/* The parent component now handles the accordion and header */}
      {renderRecipients ? renderRecipients() : <MessageRecipientsList recipients={recipients} />}
    </>
  );
}
