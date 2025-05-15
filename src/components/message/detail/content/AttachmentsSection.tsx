
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MessageAttachments } from "../MessageAttachments";
import { Message } from "@/types/message";

interface AttachmentsSectionProps {
  attachments: Message["attachments"];
  deliveryId?: string | null;
  recipientEmail?: string | null;
}

export function AttachmentsSection({ 
  attachments,
  deliveryId,
  recipientEmail
}: AttachmentsSectionProps) {
  if (!attachments || attachments.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">No attachments</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-medium text-lg mb-4">Attachments</h3>
        <div className="space-y-4">
          <MessageAttachments 
            message={{ attachments } as Message} 
            deliveryId={deliveryId}
            recipientEmail={recipientEmail}
          />
        </div>
      </CardContent>
    </Card>
  );
}
