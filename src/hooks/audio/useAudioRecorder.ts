
import { useState, useRef, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";

export function useAudioRecorder(audioStream: MediaStream | null, streamRef: React.RefObject<MediaStream | null>) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const durationTimerRef = useRef<number | null>(null);
  const durationCallbackRef = useRef<((duration: number) => void) | null>(null);
  const onStopCallbackRef = useRef<((blob: Blob, url: string, duration: number) => void) | null>(null);
  
  // Cleanup function to reset resources
  const cleanupResources = () => {
    console.log("Cleaning up audio recorder resources");
    
    // Clear duration timer
    if (durationTimerRef.current) {
      window.clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
      console.log("Audio duration timer cleared");
    }
    
    // Reset recording state if needed
    if (isRecording) {
      setIsRecording(false);
    }
  };

  // Effect to clean up when component unmounts
  useEffect(() => {
    return () => {
      console.log("Audio recorder unmounting, cleaning up...");
      cleanupResources();
      
      // If we have an audio URL, revoke it to prevent memory leaks
      if (audioUrl) {
        try {
          URL.revokeObjectURL(audioUrl);
          console.log("Audio URL revoked during unmount");
        } catch (e) {
          console.warn("Failed to revoke audio URL during unmount:", e);
        }
      }
    };
  }, [audioUrl]);

  // Function to update recording duration
  const updateDuration = () => {
    if (startTimeRef.current) {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setAudioDuration(elapsed);
      
      // Call duration callback if provided
      if (durationCallbackRef.current) {
        durationCallbackRef.current(elapsed);
      }
    }
  };

  // Function to start recording (with no parameters to match the usage in useAudioRecordingHandler)
  const startRecording = async () => {
    try {
      console.log("Starting audio recording...");
      audioChunksRef.current = [];
      
      // Check stream from both sources (streamRef is the most reliable)
      let stream = streamRef.current || audioStream;
      
      // If we don't have an audio stream, we can't record
      if (!stream) {
        console.error("No audio stream available for recording");
        throw new Error("Microphone not available. Please allow microphone access and try again.");
      }
      
      console.log("Audio stream tracks:", stream.getTracks().map(t => `${t.kind}: ${t.readyState}`));
      
      if (stream.getAudioTracks().length === 0) {
        console.error("No audio tracks in the stream");
        throw new Error("No audio tracks available. Please check your microphone.");
      }
      
      // Verify that the tracks are actually active
      const activeTracks = stream.getAudioTracks().filter(track => track.readyState === "live");
      if (activeTracks.length === 0) {
        console.error("No active audio tracks in the stream");
        throw new Error("Microphone is not active. Please check your device settings.");
      }
      
      // Create and configure the media recorder with error handling
      try {
        const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
        mediaRecorderRef.current = mediaRecorder;
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            console.log("Received audio data chunk:", event.data.size, "bytes");
            audioChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorder.onerror = (event) => {
          console.error("MediaRecorder error:", event);
          cleanupResources();
          toast({
            title: "Recording Error",
            description: "An error occurred during recording. Please try again.",
            variant: "destructive"
          });
        };
        
        mediaRecorder.onstop = () => {
          console.log("Media recorder stopped, processing audio...");
          if (audioChunksRef.current.length === 0) {
            console.error("No audio chunks recorded");
            toast({
              title: "Recording Error",
              description: "No audio data was recorded. Please try again.",
              variant: "destructive"
            });
            return;
          }
          
          try {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            console.log("Created audio blob:", audioBlob.size, "bytes");
            setAudioBlob(audioBlob);
            
            const audioUrl = URL.createObjectURL(audioBlob);
            console.log("Created audio URL:", audioUrl);
            setAudioUrl(audioUrl);
            setIsRecording(false);
            
            // Stop the duration timer
            if (durationTimerRef.current) {
              window.clearInterval(durationTimerRef.current);
              durationTimerRef.current = null;
            }
            
            // Call onStop callback if provided with the final blob, url and duration
            if (onStopCallbackRef.current) {
              console.log("Calling onStop callback with blob, url, and duration");
              onStopCallbackRef.current(audioBlob, audioUrl, audioDuration);
            }
          } catch (error) {
            console.error("Error processing audio after recording:", error);
            cleanupResources();
            toast({
              title: "Processing Error",
              description: "Failed to process the recorded audio.",
              variant: "destructive"
            });
          }
        };
        
        // Start the recorder
        mediaRecorder.start();
        setIsRecording(true);
        startTimeRef.current = Date.now();
        setAudioDuration(0);
        
        // Start timer to update duration
        durationTimerRef.current = window.setInterval(updateDuration, 1000);
        
        console.log("Audio recording started");
        
        // Show toast notification that recording has started
        toast({
          title: "Recording started",
          description: "Your audio recording has begun"
        });
      } catch (error) {
        console.error("Failed to create MediaRecorder:", error);
        throw new Error("Could not start recording. Your browser might not support this feature.");
      }
    } catch (error: any) {
      console.error("Error starting audio recording:", error);
      
      let errorMessage = error.message || "Error starting recording";
      
      toast({
        title: "Recording Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Reset recording state
      cleanupResources();
    }
  };
  
  // Function to stop recording with optional callback
  const stopRecording = (onStopCallback?: (blob: Blob, url: string, duration: number) => void) => {
    console.log("Stopping audio recording...");
    
    // Store callback if provided
    if (onStopCallback) {
      onStopCallbackRef.current = onStopCallback;
    }
    
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
        console.log("Recording stopped via mediaRecorder.stop()");
        
        // Show toast notification that recording has stopped
        toast({
          title: "Recording complete",
          description: "Your audio recording has been saved"
        });
      } catch (error) {
        console.error("Error stopping recording:", error);
        cleanupResources();
        
        toast({
          title: "Error",
          description: "Failed to properly stop recording. Your recording might be incomplete.",
          variant: "destructive"
        });
      }
    } else {
      console.log("No active MediaRecorder to stop");
      cleanupResources();
    }
    
    // Return the current blob for compatibility with existing code
    return Promise.resolve(audioBlob);
  };

  return {
    isRecording,
    audioBlob,
    audioUrl,
    audioDuration,
    startRecording,
    stopRecording,
    setAudioBlob,
    setAudioUrl,
    cleanupResources
  };
}
