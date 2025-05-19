
import React, { useState } from "react";
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
  renderRecipients?: () => React.ReactNode;
}

export function RecipientsSection({
  recipients,
  isArmed,
  isActionLoading,
  onSendTestMessage,
  renderRecipients
}: RecipientsSectionProps) {
  // Add state to track recent test message sends - prevent multiple clicks
  const [recentlySent, setRecentlySent] = useState(false);
  
  if (!recipients || recipients.length === 0) {
    return null;
  }
  
  // Handler for test message that prevents rapid clicks
  const handleSendTestMessage = () => {
    if (recentlySent) {
      return;
    }
    
    // Mark as recently sent to prevent further clicks
    setRecentlySent(true);
    
    // Call the actual handler
    onSendTestMessage();
    
    // Reset after 10 seconds
    setTimeout(() => {
      setRecentlySent(false);
    }, 10000);
  };
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Recipients</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendTestMessage}
            disabled={isArmed || isActionLoading || recentlySent}
            className={`whitespace-nowrap ${HOVER_TRANSITION}`}
          >
            <Mail className={`h-4 w-4 mr-2 ${HOVER_TRANSITION}`} />
            {recentlySent ? "Test Sent" : "Send Test Message"}
          </Button>
        </div>
        
        <div className="mt-2">
          {/* Use renderRecipients function if provided, otherwise use default MessageRecipientsList */}
          {renderRecipients ? renderRecipients() : <MessageRecipientsList recipients={recipients} />}
        </div>
      </CardContent>
    </Card>
  );
}
