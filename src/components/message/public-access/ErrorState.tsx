
import { AlertCircle, HelpCircle, ArrowLeft, RefreshCw, FileText, Bug } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { HOVER_TRANSITION, BUTTON_HOVER_EFFECTS } from "@/utils/hoverEffects";
import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ErrorStateProps {
  error: string;
}

export const ErrorState = ({ error }: ErrorStateProps) => {
  const [isAttachmentError, setIsAttachmentError] = useState(false);
  const [messageId, setMessageId] = useState<string | null>(null);
  const [technicalDetails, setTechnicalDetails] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [deliveryData, setDeliveryData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const deliveryId = searchParams.get('delivery');
  const recipientEmail = searchParams.get('recipient');
  
  // Log error for debugging and determine error type
  useEffect(() => {
    console.error("Message access error:", error);
    console.log("Current URL:", window.location.href);
    console.log("Message ID from params:", id);
    console.log("Delivery ID from query:", deliveryId);
    console.log("Recipient email from query:", recipientEmail);
    
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
    const messageIdFromUrl = id || getMessageIdFromUrl();
    setMessageId(messageIdFromUrl);
  }, [error, id, deliveryId, recipientEmail]);

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

  // Check delivery record in database for diagnostic purposes
  const checkDeliveryData = async () => {
    if (!messageId || !deliveryId) {
      toast({
        title: "Missing parameters",
        description: "Message ID or Delivery ID is missing",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingData(true);
    try {
      const { data, error } = await supabase
        .from('delivered_messages')
        .select('*')
        .eq('delivery_id', deliveryId)
        .eq('message_id', messageId);
      
      if (error) {
        console.error("Error fetching delivery data:", error);
        toast({
          title: "Database Error",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      setDeliveryData(data);
      console.log("Delivery data from database:", data);
      
      if (data && data.length > 0) {
        toast({
          title: "Delivery record found",
          description: "The delivery record exists in the database",
        });
      } else {
        toast({
          title: "No delivery record",
          description: "The delivery record was not found in the database",
          variant: "destructive"
        });
      }
    } catch (e) {
      console.error("Error in checkDeliveryData:", e);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Retry the same URL (will force a reload)
  const retryAccess = () => {
    window.location.reload();
  };

  // Retry without attachment parameter
  const retryWithoutAttachment = () => {
    const url = new URL(window.location.href);
    url.hash = ''; // Remove any hash part containing attachment
    url.searchParams.delete('attachment'); // Remove attachment param if present
    window.location.href = url.toString();
  };

  // Go back to previous page
  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate("/"); // Fallback to home if no history
    }
  };

  // Generate regenerate access link (would normally connect to backend)
  const regenerateAccess = () => {
    toast({
      title: "Access link regeneration",
      description: "This would typically connect to a backend to regenerate your access link. Please contact the sender to resend the message link."
    });
  };

  const toggleDebug = () => {
    setShowDebug(prev => !prev);
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Card className="p-6 border-red-200">
        <div className="flex flex-col items-center justify-center text-center space-y-4 py-6">
          <AlertCircle className={`h-12 w-12 text-red-500 ${HOVER_TRANSITION}`} />
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
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleDebug} 
              className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default} flex items-center gap-2`}
            >
              <Bug className={`h-4 w-4 ${HOVER_TRANSITION}`} />
              {showDebug ? 'Hide Diagnostics' : 'Show Diagnostics'}
            </Button>
            
            {messageId && deliveryId && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={checkDeliveryData}
                disabled={isLoadingData}
                className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default} flex items-center gap-2`}
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingData ? 'animate-spin' : ''} ${HOVER_TRANSITION}`} />
                Check Delivery
              </Button>
            )}
          </div>
          
          {showDebug && (
            <div className="bg-slate-50 border rounded p-4 text-left w-full overflow-auto">
              <h3 className="font-semibold mb-2">Debug Information:</h3>
              <p className="text-sm"><strong>Message ID:</strong> {messageId || '(not found)'}</p>
              <p className="text-sm"><strong>Delivery ID:</strong> {deliveryId || '(not found)'}</p>
              <p className="text-sm"><strong>Recipient:</strong> {recipientEmail || '(not found)'}</p>
              <p className="text-sm"><strong>Current URL:</strong> {window.location.href}</p>
              {deliveryData && (
                <>
                  <h4 className="font-medium mt-3 mb-1">Database Records:</h4>
                  <div className="text-xs overflow-auto max-h-48 bg-slate-100 p-2">
                    <pre>{JSON.stringify(deliveryData, null, 2)}</pre>
                  </div>
                </>
              )}
            </div>
          )}
          
          {isAttachmentError ? (
            <div className="bg-amber-50 border border-amber-100 rounded-md p-4 mt-2 w-full max-w-md">
              <div className="flex items-start">
                <HelpCircle className={`h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0 ${HOVER_TRANSITION}`} />
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
                  <FileText className={`h-4 w-4 ${HOVER_TRANSITION}`} />
                  Access Message Only
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-100 rounded-md p-4 mt-2 w-full max-w-md">
              <div className="flex items-start">
                <HelpCircle className={`h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0 ${HOVER_TRANSITION}`} />
                <div className="text-sm text-amber-700 text-left">
                  <p className="font-medium mb-1">Possible issues:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>The URL may have been copied incorrectly from your email</li>
                    <li>The link may be missing required parameters</li>
                    <li>The message may have expired or been deleted</li>
                    <li>The delivery ID may be invalid</li>
                    <li>The link may have been clicked multiple times</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          <Separator className="my-2" />
          
          <div className="bg-blue-50 border border-blue-100 rounded-md p-4 w-full max-w-md">
            <div className="flex items-start">
              <HelpCircle className={`h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0 ${HOVER_TRANSITION}`} />
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
          
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            <Button 
              onClick={retryAccess} 
              className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default} flex items-center gap-2`}
            >
              <RefreshCw className={`h-4 w-4 ${HOVER_TRANSITION}`} />
              Try Again
            </Button>
            <Button 
              variant="outline"
              onClick={goBack}
              className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default} flex items-center gap-2`}
            >
              <ArrowLeft className={`h-4 w-4 ${HOVER_TRANSITION}`} />
              Go Back
            </Button>
            <Button 
              variant="secondary"
              onClick={regenerateAccess}
              className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default} flex items-center gap-2 mt-2 sm:mt-0`}
            >
              <FileText className={`h-4 w-4 ${HOVER_TRANSITION}`} />
              Request New Link
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
