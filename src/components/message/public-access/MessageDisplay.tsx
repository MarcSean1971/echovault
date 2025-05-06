
import { Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Message } from "@/types/message";
import { MessageContent } from "@/components/message/detail/MessageContent";
import { MessageAttachments } from "@/components/message/detail/MessageAttachments";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { HOVER_TRANSITION, BUTTON_HOVER_EFFECTS } from "@/utils/hoverEffects";
import { Button } from "@/components/ui/button";
import { LoadingState } from "./LoadingState";

interface MessageDisplayProps {
  message: Message | null;
  isInitialLoading?: boolean;
  isPreviewMode?: boolean;
}

export const MessageDisplay = ({ 
  message, 
  isInitialLoading = false,
  isPreviewMode = false
}: MessageDisplayProps) => {
  // Get delivery ID and recipient email from URL for attachment access
  const [searchParams] = useSearchParams();
  const deliveryId = searchParams.get('delivery');
  const recipientEmail = searchParams.get('recipient');
  const [localLoading, setLocalLoading] = useState(true);
  const [showAttachments, setShowAttachments] = useState(false);
  
  // Add a local loading state to prevent flash of "not found"
  useEffect(() => {
    const timer = setTimeout(() => {
      setLocalLoading(false);
      // Always show attachments without delay
      if (message?.attachments && message.attachments.length > 0) {
        setShowAttachments(true);
      }
    }, 500); // Faster loading time
    return () => clearTimeout(timer);
  }, [message]);

  if (isInitialLoading || localLoading) {
    return <LoadingState />;
  }

  if (!message) {
    return (
      <Card className="max-w-2xl mx-auto p-6 mt-8">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Message not found</h2>
          <p className="text-gray-500">
            This message may have been deleted or the link is invalid.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto p-6 mt-4 mb-16">
      <h1 className="text-2xl font-bold mb-4">{message.title}</h1>
      
      <div className="prose max-w-full mb-6">
        <MessageContent message={message} isArmed={true} />
      </div>
      
      {message.attachments && message.attachments.length > 0 && showAttachments && (
        <>
          <Separator className="my-6" />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Attachments</h2>
            </div>
            
            <MessageAttachments 
              message={message} 
              deliveryId={deliveryId} 
              recipientEmail={recipientEmail} 
            />
          </div>
        </>
      )}
      
      {/* Footer with timestamp */}
      <div className="mt-8 pt-4 border-t text-sm text-gray-500">
        <p>This message was delivered securely.</p>
      </div>
    </Card>
  );
}
