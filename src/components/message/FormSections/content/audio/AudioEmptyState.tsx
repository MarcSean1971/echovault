
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
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

  // Handle starting recording with loading state and error handling
  const handleStartRecording = async () => {
    setIsStartingRecording(true);
    try {
      await onStartRecording();
    } catch (error) {
      console.error("Error starting recording from AudioEmptyState:", error);
    } finally {
      setIsStartingRecording(false);
    }
  };

  return (
    <Card className="p-6 flex flex-col items-center justify-center space-y-4 border-dashed border-2">
      <div className="text-center text-muted-foreground">
        {isInitializing ? (
          <div className="flex items-center justify-center space-x-2">
            <Spinner size="sm" />
            <p>Initializing microphone...</p>
          </div>
        ) : hasPermission === false ? (
          <p>Microphone access denied. Please check your browser permissions.</p>
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
