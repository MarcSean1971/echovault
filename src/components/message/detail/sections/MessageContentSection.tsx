
import React from "react";
import { Message } from "@/types/message";
import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageContent } from "../content/message-content";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { renderSectionHeader } from "../helpers/renderSectionHeader";

interface MessageContentSectionProps {
  message: Message;
  isLoading: boolean;
  deliveryId: string | null;
  recipientEmail: string | null;
}

export function MessageContentSection({
  message,
  isLoading,
  deliveryId,
  recipientEmail
}: MessageContentSectionProps) {
  return (
    <Card className="overflow-hidden border border-border/50 shadow-sm">
      <CardContent className="p-6">
        {renderSectionHeader(
          <FileText className={`h-5 w-5 text-muted-foreground ${HOVER_TRANSITION}`} />, 
          "Message Content"
        )}
        
        {/* Updated title styling to match the edit page */}
        <h3 className="font-semibold text-xl mb-4 text-purple-900">{message.title}</h3>
        
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <div className="space-y-4">
            <MessageContent 
              message={message} 
              deliveryId={deliveryId} 
              recipientEmail={recipientEmail} 
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
