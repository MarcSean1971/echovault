
import { useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageViewer } from "@/components/secure-message/MessageViewer";

interface MessageContentProps {
  message: any;
  deliveryId: string | null;
  recipientEmail: string | null;
  handleIframeMessage: (event: MessageEvent) => void;
}

export function MessageContent({ 
  message, 
  deliveryId,
  recipientEmail,
  handleIframeMessage
}: MessageContentProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <MessageViewer 
        htmlContent={message}
        pinProtected={false}
        verifyError={null}
        handleIframeMessage={handleIframeMessage}
      />
    </div>
  );
}
