
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
        
        {/* Title exactly matching the Edit page style */}
        <h2 className="text-xl font-medium mb-4">{message.title}</h2>
        
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
