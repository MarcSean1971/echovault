
import { AlertCircle, HelpCircle, ArrowLeft, RefreshCw, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { HOVER_TRANSITION, BUTTON_HOVER_EFFECTS } from "@/utils/hoverEffects";
import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";

interface ErrorStateProps {
  error: string;
}

export const ErrorState = ({ error }: ErrorStateProps) => {
  const [isAttachmentError, setIsAttachmentError] = useState(false);
  const [messageId, setMessageId] = useState<string | null>(null);
  const [technicalDetails, setTechnicalDetails] = useState<string | null>(null);
  
  // Log error for debugging and determine error type
  useEffect(() => {
    console.error("Message access error:", error);
    console.log("Current URL:", window.location.href);
    
    // Extract technical details if available
    if (error && error.includes(":")) {
      const parts = error.split(":");
      if (parts.length > 1) {
        setTechnicalDetails(parts.slice(1).join(":").trim());
      }
    }
    
    // Check if this is an attachment access error
    const isAttachmentError = error.toLowerCase().includes("attachment") || 
                              error.toLowerCase().includes("file") ||
                              window.location.href.toLowerCase().includes('attachment=');
    setIsAttachmentError(isAttachmentError);
    
    // Extract messageId from URL if present
    const messageIdFromUrl = getMessageIdFromUrl();
    setMessageId(messageIdFromUrl);
  }, [error]);

  // Extract messageId from URL if present
  const getMessageIdFromUrl = () => {
    try {
      const pathname = window.location.pathname;
      const matches = pathname.match(/\/access\/message\/([a-zA-Z0-9-]+)/);
      return matches ? matches[1] : null;
    } catch (e) {
      return null;
    }
  };

  // Retry without attachment parameter
  const retryWithoutAttachment = () => {
    const url = new URL(window.location.href);
    url.hash = ''; // Remove any hash part containing attachment
    url.searchParams.delete('attachment'); // Remove attachment param if present
    window.location.href = url.toString();
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Card className="p-6 border-red-200">
        <div className="flex flex-col items-center justify-center text-center space-y-4 py-6">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h2 className="text-xl font-semibold">Access Error</h2>
          
          <Alert variant="destructive" className="mb-2">
            <AlertTitle>Error accessing {isAttachmentError ? 'attachment' : 'message'}</AlertTitle>
            <AlertDescription>
              {error}
              {technicalDetails && (
                <div className="mt-2 text-sm opacity-80">
                  Technical details: {technicalDetails}
                </div>
              )}
            </AlertDescription>
          </Alert>
          
          {isAttachmentError ? (
            <div className="bg-amber-50 border border-amber-100 rounded-md p-4 mt-2 w-full max-w-md">
              <div className="flex items-start">
                <HelpCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-700 text-left">
                  <p className="font-medium mb-1">Attachment access issues:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>The attachment may have expired or been deleted</li>
                    <li>You might not have permission to access this file</li>
                    <li>The storage URL might be incorrect</li>
                    <li>Try accessing the main message first</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-4 flex justify-center">
                <Button 
                  onClick={retryWithoutAttachment} 
                  variant="outline"
                  className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default} flex items-center gap-2`}
                >
                  <FileText className="h-4 w-4" />
                  Access Message Only
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-100 rounded-md p-4 mt-2 w-full max-w-md">
              <div className="flex items-start">
                <HelpCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-700 text-left">
                  <p className="font-medium mb-1">Possible issues:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>The URL may have been copied incorrectly from your email</li>
                    <li>The link may be missing required parameters</li>
                    <li>The message may have expired or been deleted</li>
                    <li>The delivery ID may be invalid</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          <Separator className="my-2" />
          
          <div className="bg-blue-50 border border-blue-100 rounded-md p-4 w-full max-w-md">
            <div className="flex items-start">
              <HelpCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700 text-left">
                <p className="font-medium mb-1">Troubleshooting steps:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Open the original email and click the link directly</li>
                  <li>Check if the full URL was copied correctly</li>
                  <li>Try clearing your browser cache</li>
                  <li>Try using a different web browser</li>
                  <li>Ask the sender to resend the message</li>
                </ul>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mt-2">
            If you continue to experience issues, please contact the sender of this message and let them know about the error.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Button 
              onClick={() => window.location.reload()} 
              className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default} flex items-center gap-2`}
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.history.back()}
              className={`${HOVER_TRANSITION} flex items-center gap-2`}
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
