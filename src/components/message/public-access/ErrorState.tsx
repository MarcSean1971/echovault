
import { AlertCircle, HelpCircle, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HOVER_TRANSITION, BUTTON_HOVER_EFFECTS } from "@/utils/hoverEffects";

interface ErrorStateProps {
  error: string;
}

export const ErrorState = ({ error }: ErrorStateProps) => {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Card className="p-6 border-red-200">
        <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h2 className="text-xl font-semibold">Access Error</h2>
          <p className="text-muted-foreground">{error}</p>
          
          <div className="bg-amber-50 border border-amber-100 rounded-md p-4 mt-4 w-full max-w-md">
            <div className="flex items-start">
              <HelpCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-700 text-left">
                <p className="font-medium mb-1">Common issues:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>The URL may have been copied incorrectly</li>
                  <li>The link may be missing required parameters</li>
                  <li>The message may have expired</li>
                  <li>The message may have been deleted by the sender</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mt-2 w-full max-w-md">
            <div className="flex items-start">
              <HelpCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700 text-left">
                <p className="font-medium mb-1">Troubleshooting steps:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Check if the full URL was copied from your email</li>
                  <li>Try accessing the link from the original email again</li>
                  <li>Clear your browser cache and try again</li>
                  <li>Try a different web browser</li>
                </ul>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mt-4">
            If you continue to experience issues, please contact the sender of this message.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Button 
              onClick={() => window.location.reload()} 
              className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
            >
              Try Again
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.history.back()}
              className={`${HOVER_TRANSITION} flex items-center gap-1`}
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
