
import { AlertCircle, Check, AlertTriangle, HelpCircle } from "lucide-react";

interface StatusMessagesProps {
  isConfirming: boolean;
  locationPermission: string;
  hasPanicMessage: boolean;
  hasPanicMessages: boolean;
  isLoading: boolean;
  keepArmed?: boolean;
  inCancelWindow?: boolean;
  errorState?: {
    hasError: boolean;
    message?: string;
    isRetrying?: boolean;
  };
}

export function StatusMessages({
  isConfirming,
  locationPermission,
  hasPanicMessage,
  hasPanicMessages,
  isLoading,
  keepArmed,
  inCancelWindow,
  errorState
}: StatusMessagesProps) {
  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">
        <div className="flex items-center">
          <div className="animate-spin mr-2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          <span>Loading emergency message configuration...</span>
        </div>
      </div>
    );
  }
  
  if (errorState?.hasError) {
    return (
      <div className="text-sm text-red-600">
        <div className="flex items-center mb-1">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <span>Error: {errorState.message || "Failed to send emergency message"}</span>
        </div>
        {errorState.isRetrying && (
          <div className="flex items-center text-amber-600 mt-1">
            <div className="animate-spin mr-2 h-3 w-3 border-2 border-amber-600 border-t-transparent rounded-full" />
            <span>Retrying automatically...</span>
          </div>
        )}
        <div className="mt-1 text-xs">
          Please try again. If the problem persists, contact support.
        </div>
      </div>
    );
  }

  if (!hasPanicMessage && !hasPanicMessages) {
    return (
      <div className="text-sm text-muted-foreground">
        <div className="flex items-center">
          <HelpCircle className="h-4 w-4 mr-2" />
          <span>No emergency messages configured</span>
        </div>
        <p className="mt-1 text-xs">
          Create an emergency message to enable the panic button feature.
        </p>
      </div>
    );
  }
  
  if (isConfirming && !inCancelWindow) {
    return (
      <div className="text-sm text-amber-600">
        <div className="flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span>Press again to confirm sending emergency message</span>
        </div>
      </div>
    );
  }
  
  if (inCancelWindow) {
    return (
      <div className="text-sm text-red-600 animate-pulse">
        <div className="flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span>Click to CANCEL sending emergency message</span>
        </div>
      </div>
    );
  }

  return (
    <div className="text-sm">
      <div className="flex items-center text-green-600">
        <Check className="h-4 w-4 mr-2" />
        <span>Emergency message ready to trigger</span>
      </div>
      
      {locationPermission !== "granted" && (
        <div className="flex items-center mt-1 text-xs text-amber-600">
          <AlertCircle className="h-3 w-3 mr-1" />
          <span>Location permission: {locationPermission}</span>
        </div>
      )}
      
      {keepArmed !== undefined && (
        <div className="mt-1 text-xs text-muted-foreground">
          {keepArmed 
            ? "Message will remain armed after sending" 
            : "Message will be disarmed after sending"}
        </div>
      )}
    </div>
  );
}
