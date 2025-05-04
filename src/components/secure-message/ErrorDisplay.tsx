
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { HOVER_TRANSITION, ICON_HOVER_EFFECTS } from "@/utils/hoverEffects";

interface ErrorDisplayProps {
  error: string;
  technicalDetails: string | null;
  onRetry: () => void;
}

export function ErrorDisplay({ error, technicalDetails, onRetry }: ErrorDisplayProps) {
  return (
    <div className="container mx-auto px-4 py-16">
      <Card className="w-full max-w-lg p-8 mx-auto">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          
          <h1 className="text-2xl font-bold text-destructive mb-4">Error</h1>
          <p className="mb-6">{error}</p>
          
          {technicalDetails && (
            <Alert variant="destructive" className="mb-6 text-left">
              <AlertCircle className={`h-4 w-4 ${ICON_HOVER_EFFECTS.destructive}`} />
              <AlertTitle>Technical Details</AlertTitle>
              <AlertDescription className="text-xs overflow-auto max-h-[200px] whitespace-pre-wrap">
                {technicalDetails}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="secondary" 
              onClick={() => window.history.back()}
              className={`hover:bg-secondary/90 ${HOVER_TRANSITION} flex items-center gap-2`}
            >
              <ArrowLeft className={`h-4 w-4 ${ICON_HOVER_EFFECTS.default}`} />
              Go Back
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onRetry}
              className={`flex items-center gap-2 hover:bg-accent/80 ${HOVER_TRANSITION}`}
            >
              <RefreshCw className={`h-4 w-4 ${ICON_HOVER_EFFECTS.default}`} />
              Retry
            </Button>
          </div>
          
          <p className="mt-6 text-sm text-muted-foreground">
            If this error persists, please contact the sender of the message or check your email for a valid link.
          </p>
        </div>
      </Card>
    </div>
  );
}
