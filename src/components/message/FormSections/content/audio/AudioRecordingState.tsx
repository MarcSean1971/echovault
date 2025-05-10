
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { formatTime } from "@/utils/mediaUtils";

interface AudioRecordingStateProps {
  audioDuration: number;
  onStopRecording: () => void;
}

export function AudioRecordingState({
  audioDuration,
  onStopRecording
}: AudioRecordingStateProps) {
  return (
    <Card className="p-6 bg-red-50 dark:bg-red-950/20">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="absolute -inset-1 bg-red-500 rounded-full animate-ping opacity-75"></div>
          <div className="relative bg-red-600 text-white p-4 rounded-full">
            <Mic className="h-6 w-6" />
          </div>
        </div>
        <p className="text-lg font-medium">Recording audio...</p>
        <p className="text-sm text-muted-foreground">{formatTime(audioDuration)}</p>
        
        <Button 
          onClick={onStopRecording}
          variant="destructive"
          type="button" 
          className="hover:bg-destructive/90 hover:scale-105 transition-all"
        >
          <MicOff className="h-4 w-4 mr-2" />
          Stop Recording
        </Button>
      </div>
    </Card>
  );
}
