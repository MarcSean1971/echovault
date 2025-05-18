
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Users } from "lucide-react";
import { MessageRecipientsList } from "../MessageRecipientsList";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface RecipientsSectionProps {
  recipients: any[];
  isArmed: boolean;
  isActionLoading: boolean;
  onSendTestMessage: () => void;
}

export function RecipientsSection({
  recipients,
  isArmed,
  isActionLoading,
  onSendTestMessage
}: RecipientsSectionProps) {
  if (!recipients || recipients.length === 0) {
    return null;
  }
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Recipients</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onSendTestMessage}
            disabled={isArmed || isActionLoading}
            className="whitespace-nowrap"
          >
            <Mail className={`h-4 w-4 mr-2 ${HOVER_TRANSITION}`} />
            Send Test Message
          </Button>
        </div>
        
        <div className="mt-2">
          <MessageRecipientsList recipients={recipients} />
        </div>
      </CardContent>
    </Card>
  );
}
