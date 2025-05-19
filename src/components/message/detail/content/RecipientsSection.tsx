
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import { MessageRecipientsList } from "../MessageRecipientsList";
import { HOVER_TRANSITION, ICON_HOVER_EFFECTS } from "@/utils/hoverEffects";

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
    <div className="space-y-4">
      <div className="flex items-center mb-2">
        <Users className={`h-4 w-4 mr-2 text-muted-foreground ${ICON_HOVER_EFFECTS.default}`} />
        <h3 className="text-sm font-medium text-muted-foreground">Recipients</h3>
      </div>
      
      <div className="mt-2">
        {/* Use renderRecipients function if provided, otherwise use default MessageRecipientsList */}
        {renderRecipients ? renderRecipients() : <MessageRecipientsList recipients={recipients} />}
      </div>
    </div>
  );
}
