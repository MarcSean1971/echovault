
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Users } from "lucide-react";

interface RecipientsCardProps {
  recipients: { id: string; name: string; email: string; }[];
  renderRecipients: () => React.ReactNode;
  isArmed: boolean;
  isActionLoading: boolean;
  onSendTestMessage: () => void;
}

export function RecipientsCard({
  recipients,
  renderRecipients,
  isArmed,
  isActionLoading,
  onSendTestMessage
}: RecipientsCardProps) {
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Recipients</h3>
          <Users className="h-5 w-5 text-muted-foreground" />
        </div>
        {renderRecipients()}
        
        {/* Add Test Message Button */}
        {recipients && recipients.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={onSendTestMessage}
            disabled={isArmed || isActionLoading}
          >
            <Mail className="h-4 w-4 mr-2" />
            Send Test Message
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
