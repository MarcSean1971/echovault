
import { Shield, Check, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Message } from "@/types/message";
import { MessageContent } from "@/components/message/detail/MessageContent";
import { MessageAttachments } from "@/components/message/detail/MessageAttachments";
import { useSearchParams } from "react-router-dom";

interface MessageDisplayProps {
  message: Message | null;
}

export const MessageDisplay = ({ message }: MessageDisplayProps) => {
  // Get delivery ID and recipient email from URL for attachment access
  const [searchParams] = useSearchParams();
  const deliveryId = searchParams.get('delivery');
  const recipientEmail = searchParams.get('recipient');

  if (!message) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
            <AlertCircle className="h-12 w-12 text-amber-500" />
            <h2 className="text-xl font-semibold">Message Not Available</h2>
            <p className="text-muted-foreground">
              There was a problem loading the message content. Please try again later.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-green-500" />
            <h2 className="text-xl font-semibold">{message.title}</h2>
          </div>
          
          <div className="bg-green-50 border border-green-100 rounded-md p-3 flex items-center space-x-2">
            <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-700">Secure message access verified</p>
          </div>
          
          <Separator />
          
          <MessageContent message={message} isArmed={false} />
          
          {message.attachments && message.attachments.length > 0 && (
            <div className="pt-4">
              <h3 className="text-lg font-medium mb-2">Attachments</h3>
              <MessageAttachments 
                message={message} 
                deliveryId={deliveryId || undefined}
                recipientEmail={recipientEmail || undefined}
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
