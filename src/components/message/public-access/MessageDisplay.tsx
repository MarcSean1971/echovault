
import { Shield, Check, AlertCircle, Bug } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Message } from "@/types/message";
import { MessageContent } from "@/components/message/detail/MessageContent";
import { MessageAttachments } from "@/components/message/detail/MessageAttachments";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { HOVER_TRANSITION, BUTTON_HOVER_EFFECTS } from "@/utils/hoverEffects";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { LoadingState } from "./LoadingState";

interface MessageDisplayProps {
  message: Message | null;
  isInitialLoading?: boolean;
}

export const MessageDisplay = ({ message, isInitialLoading = false }: MessageDisplayProps) => {
  // Get delivery ID and recipient email from URL for attachment access
  const [searchParams] = useSearchParams();
  const deliveryId = searchParams.get('delivery');
  const recipientEmail = searchParams.get('recipient');
  const [showDebug, setShowDebug] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);
  
  // Add a local loading state to prevent flash of "not found"
  useEffect(() => {
    const timer = setTimeout(() => {
      setLocalLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Log parameters for debugging
  useEffect(() => {
    if (message) {
      console.log("===== Message Display Debug Info =====");
      console.log("Message ID:", message.id);
      console.log("Delivery ID:", deliveryId);
      console.log("Recipient email:", recipientEmail);
      console.log("Current URL:", window.location.href);
      
      if (message.attachments && message.attachments.length > 0) {
        console.log("Message attachments:", message.attachments);
        message.attachments.forEach((att, index) => {
          console.log(`Attachment ${index + 1}:`, {
            name: att.name,
            size: att.size,
            type: att.type,
            path: att.path
          });
        });
      }
    }
  }, [message, deliveryId, recipientEmail]);

  const toggleDebug = () => {
    setShowDebug(prev => !prev);
    if (!showDebug) {
      toast({
        title: "Debug Mode Activated",
        description: "Showing extended diagnostics information"
      });
    }
  };

  // If we're in any loading phase, show loading spinner/skeleton instead of "not found"
  if (isInitialLoading || localLoading) {
    return <LoadingState />;
  }

  if (!message) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
            <AlertCircle className={`h-12 w-12 text-amber-500 ${HOVER_TRANSITION}`} />
            <h2 className="text-xl font-semibold">Message Not Available</h2>
            <p className="text-muted-foreground">
              There was a problem loading the message content. Please try again later.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleDebug} 
              className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
            >
              <Bug className={`h-4 w-4 mr-2 ${HOVER_TRANSITION}`} />
              {showDebug ? 'Hide Diagnostics' : 'Show Diagnostics'}
            </Button>
            
            {showDebug && (
              <div className="mt-4 border rounded p-4 text-left bg-slate-50 w-full overflow-auto">
                <h3 className="font-medium mb-2">Access Parameters:</h3>
                <p className="text-sm"><strong>Message ID:</strong> {searchParams.get('id') || '(not found)'}</p>
                <p className="text-sm"><strong>Delivery ID:</strong> {deliveryId || '(not found)'}</p>
                <p className="text-sm"><strong>Recipient:</strong> {recipientEmail || '(not found)'}</p>
                <p className="text-sm"><strong>Current URL:</strong> {window.location.href}</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className={`h-5 w-5 text-green-500 ${HOVER_TRANSITION}`} />
              <h2 className="text-xl font-semibold">{message.title}</h2>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleDebug} 
              className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
            >
              <Bug className={`h-4 w-4 mr-2 ${HOVER_TRANSITION}`} />
              {showDebug ? 'Hide Debug' : 'Debug'}
            </Button>
          </div>
          
          {showDebug && (
            <div className="bg-slate-50 border rounded p-3 text-xs overflow-auto">
              <h3 className="font-medium mb-1">Debug Information:</h3>
              <p><strong>Message ID:</strong> {message.id}</p>
              <p><strong>Delivery ID:</strong> {deliveryId || '(not found)'}</p>
              <p><strong>Recipient:</strong> {recipientEmail || '(not found)'}</p>
              <p><strong>Attachment count:</strong> {message.attachments?.length || 0}</p>
              <p><strong>Current URL:</strong> {window.location.href}</p>
            </div>
          )}
          
          <div className="bg-green-50 border border-green-100 rounded-md p-3 flex items-center space-x-2">
            <Check className={`h-5 w-5 text-green-500 flex-shrink-0 ${HOVER_TRANSITION}`} />
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
}
