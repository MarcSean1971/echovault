
import { Shield, Check, AlertCircle, Bug, Download } from "lucide-react";
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
import { FileAccessManager } from "@/services/messages/fileAccess";

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
  const [showDebug, setShowDebug] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);
  const [showAttachments, setShowAttachments] = useState(false);

  // Add a banner message for development mode
  const isDevelopment = isPreviewMode || searchParams.get('debug') === 'true'; 
  
  // Show debug mode immediately if URL contains debug=true
  useEffect(() => {
    if (searchParams.get('debug') === 'true') {
      setShowDebug(true);
      toast({
        title: "Debug Mode Active",
        description: "Showing extended diagnostic information",
      });
    }
    
    // Show preview mode message if applicable
    if (isPreviewMode) {
      toast({
        title: "Preview Mode Active",
        description: "This is a test view - some features may be limited",
      });
    }
  }, [searchParams, isPreviewMode]);
  
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

  // Log parameters for debugging
  useEffect(() => {
    if (message) {
      console.log("===== Message Display Debug Info =====");
      console.log("Message ID:", message.id);
      console.log("Delivery ID:", deliveryId);
      console.log("Recipient email:", recipientEmail);
      console.log("Is Preview Mode:", isPreviewMode);
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
  }, [message, deliveryId, recipientEmail, isPreviewMode]);

  // Force download all attachments at once
  const downloadAllAttachments = async () => {
    if (!message?.attachments || message.attachments.length === 0 || !deliveryId || !recipientEmail) {
      toast({
        title: "Unable to download files",
        description: isPreviewMode 
          ? "Downloads are limited in preview mode. Try clicking individual download buttons."
          : "Missing required information for downloads. Try refreshing the page.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Starting downloads",
      description: `Downloading ${message.attachments.length} files...`
    });

    // Download each attachment with a slight delay to prevent browser blocking
    message.attachments.forEach((attachment, index) => {
      setTimeout(async () => {
        try {
          console.log(`Starting download for attachment ${index + 1}: ${attachment.name}`);
          const fileAccessManager = new FileAccessManager(attachment.path, deliveryId, recipientEmail);
          const { url } = await fileAccessManager.getAccessUrl('secure', 'download');
          
          if (url) {
            console.log(`Got download URL for ${attachment.name}: ${url}`);
            // Force download using our FileAccessManager
            FileAccessManager.executeDownload(url, attachment.name, attachment.type, 'secure');
          } else {
            console.error(`Failed to get URL for ${attachment.name}`);
            toast({
              title: "Download error",
              description: `Could not download ${attachment.name}. Try clicking the individual download button instead.`,
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error(`Error downloading ${attachment.name}:`, error);
          toast({
            title: "Download failed",
            description: "An error occurred. Try using individual download buttons instead.",
            variant: "destructive"
          });
        }
      }, index * 1500); // Delay each download by 1.5 seconds
    });
  };

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
              {isPreviewMode 
                ? "This is a preview view. In real usage, message content would appear here."
                : "There was a problem loading the message content. Please try again later."}
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
                <p className="text-sm"><strong>Preview Mode:</strong> {isPreviewMode ? 'Yes' : 'No'}</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      {isDevelopment && (
        <div className="bg-amber-100 border-l-4 border-amber-500 p-4 mb-4">
          <p className="text-amber-700">
            <strong>{isPreviewMode ? 'PREVIEW MODE' : 'DEVELOPMENT MODE'}</strong> - {isPreviewMode ? 'Testing message display with simulated delivery' : 'Reduced security checks are active for testing purposes.'}
          </p>
        </div>
      )}
      
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
              <p><strong>Preview Mode:</strong> {isPreviewMode ? 'Yes' : 'No'}</p>
              <p><strong>Attachment count:</strong> {message.attachments?.length || 0}</p>
              <p><strong>Current URL:</strong> {window.location.href}</p>
            </div>
          )}
          
          <div className="bg-green-50 border border-green-100 rounded-md p-3 flex items-center space-x-2">
            <Check className={`h-5 w-5 text-green-500 flex-shrink-0 ${HOVER_TRANSITION}`} />
            <p className="text-sm text-green-700">
              {isPreviewMode
                ? "Preview mode active - simulating secure message access"
                : "Secure message access verified"}
            </p>
          </div>
          
          <Separator />
          
          <MessageContent message={message} isArmed={false} />
          
          {message.attachments && message.attachments.length > 0 && showAttachments && (
            <div className="pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Attachments</h3>
                
                {deliveryId && recipientEmail && message.attachments.length > 0 && (
                  <Button 
                    onClick={downloadAllAttachments}
                    className={`bg-green-600 hover:bg-green-700 text-white ${isPreviewMode ? '' : 'animate-pulse-once'} shadow-md ${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
                  >
                    <Download className={`h-4 w-4 mr-2 ${HOVER_TRANSITION}`} />
                    Download All
                  </Button>
                )}
              </div>
              
              <MessageAttachments 
                message={message} 
                deliveryId={deliveryId || undefined}
                recipientEmail={recipientEmail || undefined}
              />
              
              {/* Simple download instructions */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded text-sm">
                <p className="font-medium text-blue-700 mb-2">Having trouble downloading?</p>
                <ol className="list-decimal pl-5 space-y-1 text-blue-700">
                  <li>Use the green <strong>"Download All"</strong> button at the top to download all files at once</li>
                  <li>Or click the green <strong>shield icon</strong> next to any attachment to force a secure download</li>
                  <li>If those don't work, try the regular download button (arrow icon)</li>
                  <li>Still having issues? Click the "Debug" button in the top right for more information</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
