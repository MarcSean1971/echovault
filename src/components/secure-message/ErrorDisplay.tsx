
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { HOVER_TRANSITION, ICON_HOVER_EFFECTS } from "@/utils/hoverEffects";

interface ErrorDisplayProps {
  error: string;
  technicalDetails?: string | null;
  onRetry?: () => void;
}

export function ErrorDisplay({ 
  error, 
  technicalDetails, 
  onRetry 
}: ErrorDisplayProps) {
  const currentUrl = window.location.href;
  const currentHost = window.location.host;
  const apiEndpoint = "onwthrpgcnfydxzzmyot.supabase.co";
  
  // Extract query parameters
  const url = new URL(window.location.href);
  const messageId = url.searchParams.get("id");
  const deliveryId = url.searchParams.get("delivery");
  const recipientEmail = url.searchParams.get("recipient");
  
  return (
    <div className="container mx-auto px-4 py-16">
      <Card className="w-full max-w-lg p-8 mx-auto">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="rounded-full bg-destructive/10 p-4 mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
        
        {technicalDetails && (
          <CardContent className="border rounded-md bg-muted/50 p-4 mb-4 overflow-auto text-sm">
            <p className="mb-2 font-medium">Technical Details</p>
            <pre className="whitespace-pre-wrap">{technicalDetails}</pre>
            
            <div className="mt-4 pt-2 border-t text-xs text-muted-foreground">
              <p className="mb-1">Diagnostic Info:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Current URL: {currentUrl}</li>
                <li>Current host: {currentHost}</li>
                <li>API endpoint: {apiEndpoint}</li>
                <li>Message ID: {messageId || "not provided"}</li>
                <li>Delivery ID: {deliveryId || "not provided"}</li>
                <li>Recipient: {recipientEmail || "not provided"}</li>
              </ul>
            </div>
          </CardContent>
        )}
        
        <CardFooter className="flex-col space-y-2">
          {onRetry && (
            <Button 
              onClick={onRetry} 
              className={`w-full ${HOVER_TRANSITION}`}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${ICON_HOVER_EFFECTS.default}`} />
              Retry
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className={`w-full ${HOVER_TRANSITION}`}
          >
            <ArrowLeft className={`h-4 w-4 mr-2 ${ICON_HOVER_EFFECTS.default}`} />
            Go Back
          </Button>
          
          <p className="text-xs text-muted-foreground mt-4 text-center">
            If this error persists, please contact the sender of the message or check your email for a valid link.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
