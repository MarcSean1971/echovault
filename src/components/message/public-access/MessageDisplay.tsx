
import React, { useEffect, useState } from "react";
import { Download, Eye, Lock, Shield, Calendar, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
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
  const [contentReady, setContentReady] = useState(false);
  
  // Format date helper
  const formatMessageDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return `${date.toLocaleDateString()} · ${formatDistanceToNow(date, { addSuffix: true })}`;
    } catch (e) {
      return dateString;
    }
  };
  
  // Add a graceful loading state with immediate fade-in effect
  // MODIFIED: Show content immediately
  useEffect(() => {
    // Show initial loading indicator extremely briefly
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100); // Reduced from 300ms
    
    // Mark content as ready almost immediately
    const contentTimer = setTimeout(() => {
      setContentReady(true);
    }, 150); // Reduced from 400ms
    
    return () => {
      clearTimeout(timer);
      clearTimeout(contentTimer);
    };
  }, [message]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (!message) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Card className="overflow-hidden border-red-100">
          <div className="p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 mb-6">
              <Lock className={`h-8 w-8 text-red-500 ${HOVER_TRANSITION}`} />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Message Not Available</h2>
            <p className="text-gray-500 mb-6">
              This message may have been deleted, expired, or the link is invalid.
            </p>
            <Button variant="outline" className={`mt-2 ${HOVER_TRANSITION}`} onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 mb-16 animate-fade-in">
      {isPreviewMode && (
        <div className="mb-4 rounded-lg bg-amber-50 p-4 border border-amber-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <Eye className={`h-5 w-5 text-amber-400 ${HOVER_TRANSITION}`} aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">Preview Mode</h3>
              <p className="text-sm text-amber-700">
                You're viewing this message in preview mode. Some features may be limited.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <Card className="overflow-hidden border shadow-sm">
        {/* Message Header - Shows immediately */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">{message.title}</h1>
          <div className="flex items-center text-blue-100 text-sm">
            <Calendar className={`h-4 w-4 mr-1 ${HOVER_TRANSITION}`} />
            <span>{formatMessageDate(message.created_at)}</span>
          </div>
        </div>
        
        {/* Security Badge - Shows immediately */}
        <div className="bg-blue-50 px-6 py-2 border-b border-blue-100">
          <div className="flex items-center">
            <Shield className={`h-4 w-4 text-blue-600 mr-2 ${HOVER_TRANSITION}`} />
            <span className="text-sm font-medium text-blue-700">Secure Message</span>
            
            <Badge variant="outline" className="ml-auto border-blue-200 text-blue-700">
              <Clock className={`h-3 w-3 mr-1 ${HOVER_TRANSITION}`} /> {message.expires_at ? 'Expires' : 'No Expiration'}
            </Badge>
          </div>
        </div>
        
        {/* Message Content - Progressive loading via MessageContent component */}
        <div className="p-6">
          <div className="prose max-w-full">
            {message && <MessageContent message={message} deliveryId={deliveryId} recipientEmail={recipientEmail} />}
          </div>
        </div>
        
        {/* Footer - Shows immediately */}
        <div className="bg-gray-50 px-6 py-4 text-sm text-gray-500 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className={`h-4 w-4 mr-2 text-blue-500 ${HOVER_TRANSITION}`} />
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
