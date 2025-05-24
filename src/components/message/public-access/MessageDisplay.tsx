
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
      <div className="max-w-3xl mx-auto px-4 py-8 public-message-content email-theme">
        <Card className="overflow-hidden border-red-200 email-light-bg">
          <CardHeader className="email-light-bg border-b border-red-200">
            <CardTitle className="text-center text-red-600 email-text-heading">Message Not Available</CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center email-light-bg">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-6">
              <Lock className={`h-8 w-8 text-red-600 ${HOVER_TRANSITION}`} />
            </div>
            <p className="email-text-muted mb-6">
              This message may have been deleted, expired, or the link is invalid.
            </p>
            <Button className={`mt-2 email-button ${HOVER_TRANSITION}`} onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 mb-16 animate-fade-in public-message-content email-theme">
      <div className="public-message-content">
        {isPreviewMode && (
          <div className="mb-4 rounded-lg email-info-bg p-4 border border-purple-300">
            <div className="flex">
              <div className="flex-shrink-0">
                <Eye className={`h-5 w-5 email-icon ${HOVER_TRANSITION}`} aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium email-text-heading">Preview Mode</h3>
                <p className="text-sm email-text-muted">
                  You're viewing this message in preview mode. Some features may be limited.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <Card className="overflow-hidden border-gray-300 shadow-lg email-light-bg">
          {/* Message Header */}
          <CardHeader className="email-light-bg p-6 border-b border-gray-300">
            <CardTitle className="text-2xl font-bold font-serif email-text-heading">{message.title}</CardTitle>
            <div className="flex items-center email-text-muted text-sm">
              <Calendar className={`h-4 w-4 mr-1 email-icon ${HOVER_TRANSITION}`} />
              <span className="email-text-body">{formatMessageDate(message.created_at)}</span>
            </div>
          </CardHeader>
          
          {/* Security Badge */}
          <div className="email-info-bg px-6 py-3 border-b border-gray-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Shield className={`h-4 w-4 email-icon mr-2 ${HOVER_TRANSITION}`} />
                <span className="text-sm font-medium email-text-heading">Secure Message</span>
              </div>
              
              <Badge className="email-button text-white border-0">
                <Clock className={`h-3 w-3 mr-1 ${HOVER_TRANSITION}`} /> 
                <span className="text-white">{message.expires_at ? 'Expires' : 'No Expiration'}</span>
              </Badge>
            </div>
          </div>
          
          {/* Message Content */}
          <CardContent className="p-6 email-light-bg">
            <div className="prose max-w-full">
              {message && <MessageContent message={message} deliveryId={deliveryId} recipientEmail={recipientEmail} />}
            </div>
          </CardContent>
          
          {/* Footer */}
          <div className="email-light-bg px-6 py-4 text-sm border-t border-gray-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Shield className={`h-4 w-4 mr-2 email-icon ${HOVER_TRANSITION}`} />
                <span className="email-text-body">This message was delivered securely</span>
              </div>
              
              <div>
                {message.sender_name && (
                  <span className="email-text-body">From: {message.sender_name}</span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
