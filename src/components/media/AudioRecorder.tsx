
import React, { useEffect } from "react";
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
  
  // Log component mount and browser support
  useEffect(() => {
    console.log("AudioRecorder mounted, browser supported:", isBrowserSupported);
    
    // Check for MediaRecorder support on mount
    if (window.MediaRecorder) {
      console.log("MediaRecorder is supported");
      console.log("Available MIME types:", MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm supported' : 'audio/webm not supported');
    } else {
      console.error("MediaRecorder is not supported in this browser");
    }
    
    return () => {
      console.log("AudioRecorder unmounting");
    };
  }, [isBrowserSupported]);
  
  // Log recording status changes
  useEffect(() => {
    console.log("Recording status:", isRecording ? "recording" : "not recording", "isPaused:", isPaused);
  }, [isRecording, isPaused]);
  
  // Log duration changes
  useEffect(() => {
    if (isRecording) {
      console.log("Current recording duration:", recordingDuration);
    }
  }, [recordingDuration, isRecording]);
  
  const handleAccept = async () => {
    if (!audioBlob) {
      console.error("No audio blob available");
      return;
    }
    
    try {
      console.log("Processing audio blob:", audioBlob.size);
      const base64Audio = await blobToBase64(audioBlob);
      console.log("Audio converted to base64, length:", base64Audio.length);
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
                <Mic className="w-10 h-10 text-primary hover:scale-110 transition-all duration-200" />
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
        <Button variant="ghost" size="sm" onClick={onCancel} className="hover:bg-gray-100 transition-colors duration-200">
          Cancel
        </Button>
      </div>
    </div>
  );
}
