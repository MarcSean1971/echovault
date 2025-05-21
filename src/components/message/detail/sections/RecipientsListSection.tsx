
import React from "react";
import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RecipientsSection } from "../content/RecipientsSection";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface RecipientsListSectionProps {
  recipients: any[];
  isArmed: boolean;
  isActionLoading: boolean;
  onSendTestMessage: () => void;
}

export function RecipientsListSection({
  recipients,
  isArmed,
  isActionLoading,
  onSendTestMessage
}: RecipientsListSectionProps) {
  const renderSectionHeader = (icon: React.ReactNode, title: string) => (
    <div className="flex items-center space-x-2 mb-4 pb-2 border-b">
      {icon}
      <h2 className="text-lg font-medium">{title}</h2>
    </div>
  );

  return (
    <Card className="overflow-hidden border border-border/50 shadow-sm">
      <CardContent className="p-6">
        {renderSectionHeader(
          <Users className={`h-5 w-5 text-muted-foreground ${HOVER_TRANSITION}`} />, 
          "Recipients"
        )}
        {recipients && recipients.length > 0 ? (
          <RecipientsSection
            recipients={recipients}
            isArmed={isArmed}
            isActionLoading={isActionLoading}
            onSendTestMessage={onSendTestMessage}
          />
        ) : (
          <p className="text-muted-foreground text-sm">No recipients</p>
        )}
      </CardContent>
    </Card>
  );
}
