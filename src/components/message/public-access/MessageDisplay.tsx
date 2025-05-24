
import React, { useEffect, useState } from "react";
import { Download, Eye, Lock, Shield, Calendar, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Message } from "@/types/message";
import { MessageContent } from "@/components/message/detail/MessageContent";
import { useSearchParams } from "react-router-dom";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { Button } from "@/components/ui/button";
import { LoadingState } from "./LoadingState";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface MessageDisplayProps {
  message: Message | null;
  isPreviewMode?: boolean;
}

export const MessageDisplay = ({ 
  message, 
  isPreviewMode = false
}: MessageDisplayProps) => {
  // Get delivery ID and recipient email from URL for attachment access
  const [searchParams] = useSearchParams();
  const deliveryId = searchParams.get('delivery');
  const recipientEmail = searchParams.get('recipient');
  
  const [isLoading, setIsLoading] = useState(true);
  
  // Format date helper
  const formatMessageDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return `${date.toLocaleDateString()} · ${formatDistanceToNow(date, { addSuffix: true })}`;
    } catch (e) {
      return dateString;
    }
  };
  
  // Show content immediately without artificial delays
  useEffect(() => {
    // Show loading state for just a minimal time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 50); // Minimal delay, just for transition
    
    return () => {
      clearTimeout(timer);
    };
  }, [message]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (!message) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card className="overflow-hidden border-destructive/20">
          <CardHeader className="bg-destructive/10">
            <CardTitle className="text-center text-destructive">Message Not Available</CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-6">
              <Lock className={`h-8 w-8 text-destructive ${HOVER_TRANSITION}`} />
            </div>
            <p className="text-muted-foreground mb-6">
              This message may have been deleted, expired, or the link is invalid.
            </p>
            <Button variant="outline" className={`mt-2 ${HOVER_TRANSITION}`} onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 mb-16 animate-fade-in">
      {isPreviewMode && (
        <div className="mb-4 rounded-lg bg-secondary/50 p-4 border border-secondary">
          <div className="flex">
            <div className="flex-shrink-0">
              <Eye className={`h-5 w-5 text-accent ${HOVER_TRANSITION}`} aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-secondary-foreground">Preview Mode</h3>
              <p className="text-sm text-muted-foreground">
                You're viewing this message in preview mode. Some features may be limited.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <Card className="overflow-hidden border shadow-sm">
        {/* Message Header - Now uses hero-gradient with dark text to match landing page */}
        <CardHeader className="hero-gradient p-6">
          <CardTitle className="text-2xl font-bold font-serif text-foreground">{message.title}</CardTitle>
          <div className="flex items-center text-muted-foreground text-sm">
            <Calendar className={`h-4 w-4 mr-1 ${HOVER_TRANSITION}`} />
            <span>{formatMessageDate(message.created_at)}</span>
          </div>
        </CardHeader>
        
        {/* Security Badge */}
        <div className="bg-secondary/30 px-6 py-2 border-b border-secondary">
          <div className="flex items-center">
            <Shield className={`h-4 w-4 text-primary mr-2 ${HOVER_TRANSITION}`} />
            <span className="text-sm font-medium text-secondary-foreground">Secure Message</span>
            
            <Badge variant="outline" className="ml-auto border-secondary text-secondary-foreground">
              <Clock className={`h-3 w-3 mr-1 ${HOVER_TRANSITION}`} /> {message.expires_at ? 'Expires' : 'No Expiration'}
            </Badge>
          </div>
        </div>
        
        {/* Message Content */}
        <CardContent className="p-6">
          <div className="prose max-w-full">
            {message && <MessageContent message={message} deliveryId={deliveryId} recipientEmail={recipientEmail} />}
          </div>
        </CardContent>
        
        {/* Footer */}
        <div className="bg-secondary/30 px-6 py-4 text-sm text-secondary-foreground border-t border-secondary">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className={`h-4 w-4 mr-2 text-primary ${HOVER_TRANSITION}`} />
              <span>This message was delivered securely</span>
            </div>
            
            <div>
              {message.sender_name && (
                <span>From: {message.sender_name}</span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
