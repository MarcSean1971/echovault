
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, RefreshCcw } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

interface AudioEmptyStateProps {
  isInitializing: boolean;
  hasPermission: boolean | null;
  onStartRecording: () => Promise<void>;
}

export function AudioEmptyState({
  isInitializing,
  hasPermission,
  onStartRecording
}: AudioEmptyStateProps) {
  const [isStartingRecording, setIsStartingRecording] = useState(false);
  const [initFailureCount, setInitFailureCount] = useState(0);

  // Track initialization failures
  useEffect(() => {
    if (hasPermission === false && !isInitializing) {
      setInitFailureCount(prev => prev + 1);
    }
  }, [hasPermission, isInitializing]);

  // Handle starting recording with loading state and error handling
  const handleStartRecording = async () => {
    setIsStartingRecording(true);
    try {
      await onStartRecording();
    } catch (error) {
      console.error("Error starting recording from AudioEmptyState:", error);
      setInitFailureCount(prev => prev + 1);
    } finally {
      setIsStartingRecording(false);
    }
  };
  
  // Handle retrying initialization
  const handleRetry = async () => {
    setIsStartingRecording(true);
    try {
      await onStartRecording();
    } catch (error) {
      console.error("Error retrying microphone initialization:", error);
    } finally {
      setIsStartingRecording(false);
    }
  };

  return (
    <Card className="p-6 flex flex-col items-center justify-center space-y-4 border-dashed border-2">
      <div className="text-center text-muted-foreground">
        {isInitializing ? (
          <div className="flex flex-col items-center justify-center space-y-2">
            <Spinner size="md" />
            <p>Initializing microphone...</p>
            <p className="text-xs text-muted-foreground">This may take a moment</p>
          </div>
        ) : hasPermission === false ? (
          <div className="space-y-3">
            <p className="text-red-500">Microphone access {initFailureCount > 1 ? "still " : ""}denied.</p>
            <p className="text-sm">Please check your browser permissions or try a different browser.</p>
            <Button 
              onClick={handleRetry}
              disabled={isStartingRecording}
              variant="outline"
              className="flex items-center space-x-2 hover:bg-primary/10 transition-all"
            >
              {isStartingRecording ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  <span>Retrying...</span>
                </>
              ) : (
                <>
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  <span>Try Again</span>
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            <p className="mb-2">Record an audio message</p>
            <Button 
              onClick={handleStartRecording}
              disabled={isInitializing || isStartingRecording}
              className="flex items-center space-x-2 hover:bg-primary/90 hover:scale-105 transition-all"
            >
              {isStartingRecording ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  <span>Start Recording</span>
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
