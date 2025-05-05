
import { AlertCircle, HelpCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { HOVER_TRANSITION, BUTTON_HOVER_EFFECTS } from "@/utils/hoverEffects";
import { useEffect, useState } from "react";

interface ErrorStateProps {
  error: string;
}

export const ErrorState = ({ error }: ErrorStateProps) => {
  const [isAttachmentError, setIsAttachmentError] = useState(false);
  
  // Log error for debugging
  useEffect(() => {
    console.error("Message access error:", error);
    console.log("Current URL:", window.location.href);
    
    // Check if this is an attachment access error
    const isAttachment = window.location.hash.includes('attachment=');
    setIsAttachmentError(isAttachment);
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

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Card className="p-6 border-red-200">
        <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h2 className="text-xl font-semibold">Access Error</h2>
          
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error accessing {isAttachmentError ? 'attachment' : 'message'}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          
          {isAttachmentError ? (
            <div className="bg-amber-50 border border-amber-100 rounded-md p-4 mt-4 w-full max-w-md">
              <div className="flex items-start">
                <HelpCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-700 text-left">
                  <p className="font-medium mb-1">Attachment access issues:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>The attachment link may have expired</li>
                    <li>You might need to access the message first before viewing attachments</li>
                    <li>Try accessing the main message link from your email</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-100 rounded-md p-4 mt-4 w-full max-w-md">
              <div className="flex items-start">
                <HelpCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-700 text-left">
                  <p className="font-medium mb-1">Common issues:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>The URL may have been copied incorrectly from your email</li>
                    <li>The link may be missing required parameters</li>
                    <li>The message may have expired or been deleted</li>
                    <li>The message delivery may not have been recorded properly</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mt-2 w-full max-w-md">
            <div className="flex items-start">
              <HelpCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700 text-left">
                <p className="font-medium mb-1">Troubleshooting steps:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Open the original email and click the link directly</li>
                  <li>Check if the full URL was copied from your email</li>
                  <li>Try clearing your browser cache and try again</li>
                  <li>Try using a different web browser</li>
                  <li>Ask the sender to resend the message</li>
                </ul>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mt-4">
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
};
