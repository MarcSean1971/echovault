
import React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Mic } from "lucide-react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { RecordingIndicator } from "./audio/RecordingIndicator";
import { RecordingControls } from "./audio/RecordingControls";
import { PlaybackControls } from "./audio/PlaybackControls";
import { blobToBase64 } from "@/utils/audioUtils";
import { formatDuration } from "@/utils/audioUtils";

interface AudioRecorderProps {
  onAudioReady: (audioBlob: Blob, audioBase64: string) => void;
  onCancel: () => void;
}

export function AudioRecorder({ onAudioReady, onCancel }: AudioRecorderProps) {
  const {
    isRecording,
    isPaused,
    isPlaying,
    recordingDuration,
    audioURL,
    audioBlob,
    isBrowserSupported,
    audioRef,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    togglePlayback,
    handleAudioEnded,
    reset
  } = useAudioRecorder();
  
  const handleAccept = async () => {
    if (!audioBlob) return;
    
    try {
      const base64Audio = await blobToBase64(audioBlob);
      onAudioReady(audioBlob, base64Audio);
    } catch (err) {
      console.error("Error processing audio:", err);
      toast({
        title: "Error",
        description: "Failed to process the recorded audio.",
        variant: "destructive"
      });
    }
  };
  
  if (!isBrowserSupported) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive mb-4">Your browser doesn't support audio recording.</p>
        <Button onClick={onCancel} variant="outline">Cancel</Button>
      </div>
    );
  }
  
  return (
    <div className="p-4 bg-background rounded-lg border">
      <div className="flex flex-col items-center justify-center gap-4">
        {/* Recording or playback UI */}
        {!audioURL ? (
          // Recording UI
          <>
            {isRecording ? (
              <RecordingIndicator isPaused={isPaused} />
            ) : (
              <div className="relative w-20 h-20 rounded-full border-2 border-primary flex items-center justify-center mb-2">
                <Mic className="w-10 h-10 text-primary" />
              </div>
            )}
            
            <div className="text-center mb-4">
              {isRecording ? (
                <div className="text-lg font-medium">{formatDuration(recordingDuration)}</div>
              ) : (
                <div className="text-sm text-muted-foreground">Click to start recording</div>
              )}
            </div>
            
            <RecordingControls
              isRecording={isRecording}
              isPaused={isPaused}
              onStart={startRecording}
              onPause={pauseRecording}
              onResume={resumeRecording}
              onStop={stopRecording}
            />
          </>
        ) : (
          // Playback UI
          <>
            <audio 
              ref={audioRef} 
              src={audioURL} 
              onEnded={handleAudioEnded} 
              className="hidden" 
            />
            
            <PlaybackControls
              isPlaying={isPlaying}
              recordingDuration={recordingDuration}
              onTogglePlayback={togglePlayback}
              onReset={reset}
              onAccept={handleAccept}
            />
          </>
        )}
      </div>
      
      <div className="mt-4 flex justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
