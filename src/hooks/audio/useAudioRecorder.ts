
import { useState, useRef } from "react";
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

  // Function to update recording duration
  const updateDuration = () => {
    if (startTimeRef.current) {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setAudioDuration(elapsed);
    }
  };

  // Function to start recording
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
      
      // Create and configure the media recorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log("Received audio data chunk:", event.data.size, "bytes");
          audioChunksRef.current.push(event.data);
        }
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
    } catch (error: any) {
      console.error("Error starting audio recording:", error);
      
      let errorMessage = error.message || "Error starting recording";
      
      toast({
        title: "Recording Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Reset recording state
      setIsRecording(false);
      if (durationTimerRef.current) {
        window.clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    }
  };
  
  // Function to stop recording
  const stopRecording = () => {
    console.log("Stopping audio recording...");
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      console.log("Recording stopped via mediaRecorder.stop()");
      
      // Show toast notification that recording has stopped
      toast({
        title: "Recording complete",
        description: "Your audio recording has been saved"
      });
    }
  };

  return {
    isRecording,
    audioBlob,
    audioUrl,
    audioDuration,
    startRecording,
    stopRecording,
    setAudioBlob,
    setAudioUrl
  };
}
