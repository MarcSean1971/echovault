
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/use-toast";
import { AlertCircle, Video, Square, RotateCcw, Check } from "lucide-react";
import { blobToBase64 } from "@/utils/audioUtils";
import { BUTTON_HOVER_EFFECTS, HOVER_TRANSITION } from "@/utils/hoverEffects";

interface SimpleVideoRecorderProps {
  onVideoReady: (videoBlob: Blob, videoBase64: string) => Promise<any> | void;
  onCancel: () => void;
}

export function SimpleVideoRecorder({ onVideoReady, onCancel }: SimpleVideoRecorderProps) {
  // Simple state management
  const [state, setState] = useState<'idle' | 'requesting' | 'recording' | 'preview'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  // References
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const recordedVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const videoUrlRef = useRef<string | null>(null);
  
  // Clean up function to release resources
  const cleanupResources = () => {
    // Clear any ongoing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Stop media recorder if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Stop all tracks in the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    // Revoke any object URL we've created
    if (videoUrlRef.current) {
      URL.revokeObjectURL(videoUrlRef.current);
      videoUrlRef.current = null;
    }
  };
  
  // Clean up when component unmounts
  useEffect(() => {
    return cleanupResources;
  }, []);
  
  // Request camera access
  const requestCameraAccess = async () => {
    setState('requesting');
    setError(null);
    
    try {
      // Clean up any existing resources first
      cleanupResources();
      
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser doesn't support video recording");
      }
      
      // Request camera and microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      });
      
      // Store the stream reference
      streamRef.current = stream;
      
      // Connect stream to video preview element
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(err => {
          console.error("Error playing video stream:", err);
          setError("Could not display camera preview");
        });
      }
      
      // Ready to record
      setState('idle');
    } catch (err: any) {
      console.error("Camera access error:", err);
      let message = "Could not access your camera";
      
      if (err.name === "NotAllowedError") {
        message = "Camera access was denied. Please check your browser permissions.";
      } else if (err.name === "NotFoundError") {
        message = "No camera found on your device.";
      } else if (err.name === "NotReadableError") {
        message = "Your camera might be in use by another application.";
      }
      
      setError(message);
      setState('idle');
    }
  };
  
  // Start recording video
  const startRecording = () => {
    if (!streamRef.current) {
      requestCameraAccess();
      return;
    }
    
    try {
      // Reset recording data
      chunksRef.current = [];
      setRecordingDuration(0);
      
      // Create a MediaRecorder instance
      const mimeType = 'video/webm;codecs=vp8,opus';
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
        mimeType,
        videoBitsPerSecond: 2500000,
        audioBitsPerSecond: 128000
      });
      
      // Set up data handlers
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      // Handle recording stop
      mediaRecorderRef.current.onstop = () => {
        if (chunksRef.current.length === 0) {
          toast({
            title: "Recording Error",
            description: "No data was recorded",
            variant: "destructive"
          });
          return;
        }
        
        try {
          // Create video blob from chunks
          const recordedBlob = new Blob(chunksRef.current, { type: 'video/webm' });
          
          // Create object URL for playback
          const videoUrl = URL.createObjectURL(recordedBlob);
          videoUrlRef.current = videoUrl;
          
          // Set up video playback
          if (recordedVideoRef.current) {
            recordedVideoRef.current.src = videoUrl;
          }
          
          // Update state to preview
          setState('preview');
        } catch (err) {
          console.error("Error processing recording:", err);
          toast({
            title: "Recording Error",
            description: "Could not process the recording",
            variant: "destructive"
          });
          
          setState('idle');
        }
      };
      
      // Handle recording errors
      mediaRecorderRef.current.onerror = () => {
        toast({
          title: "Recording Error",
          description: "An error occurred during recording",
          variant: "destructive"
        });
        
        stopRecording();
      };
      
      // Start recording with 1 second data intervals
      mediaRecorderRef.current.start(1000);
      
      // Set up timer to track recording duration
      timerRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      // Update state
      setState('recording');
    } catch (err) {
      console.error("Error starting recording:", err);
      toast({
        title: "Recording Error",
        description: "Could not start recording",
        variant: "destructive"
      });
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    // Clear the duration timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Stop the media recorder if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };
  
  // Reset and try again
  const resetRecording = () => {
    // Clean up any previous recording data
    if (videoUrlRef.current) {
      URL.revokeObjectURL(videoUrlRef.current);
      videoUrlRef.current = null;
    }
    
    setState('idle');
  };
  
  // Accept and process the recording
  const acceptRecording = async () => {
    if (!videoUrlRef.current || chunksRef.current.length === 0) {
      toast({
        title: "Error",
        description: "No recording available",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Create final video blob
      const recordedBlob = new Blob(chunksRef.current, { type: 'video/webm' });
      
      // Convert to base64
      const base64Video = await blobToBase64(recordedBlob);
      
      // Pass the result back
      onVideoReady(recordedBlob, base64Video);
    } catch (err) {
      console.error("Error processing video:", err);
      toast({
        title: "Error",
        description: "Could not process the recorded video",
        variant: "destructive"
      });
    }
  };
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Request camera access on first mount
  useEffect(() => {
    requestCameraAccess();
  }, []);
  
  // Render different UI based on component state
  if (state === 'requesting') {
    return (
      <div className="p-4 bg-background rounded-lg border">
        <div className="flex flex-col items-center justify-center py-8">
          <Spinner className="h-12 w-12 mb-4" />
          <p>Connecting to camera...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="p-4 bg-background rounded-lg border">
        <div className="flex flex-col items-center justify-center py-6">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="font-medium text-lg mb-2">Camera Error</h3>
          <p className="text-center text-muted-foreground mb-4">{error}</p>
          <div className="space-x-4">
            <Button 
              onClick={requestCameraAccess}
              className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
            >
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={onCancel}
              className={HOVER_TRANSITION}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 bg-background rounded-lg border">
      <div className="flex flex-col items-center justify-center gap-4">
        {/* Video display area (either preview or recording) */}
        {state === 'preview' ? (
          <div className="w-full aspect-video bg-black rounded-md overflow-hidden">
            <video 
              ref={recordedVideoRef}
              className="w-full h-full object-cover"
              controls
            />
          </div>
        ) : (
          <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden">
            <video 
              ref={videoPreviewRef}
              className="w-full h-full object-cover"
              autoPlay 
              playsInline 
              muted
            />
            
            {/* Recording indicator */}
            {state === 'recording' && (
              <div className="absolute top-2 left-2 right-2 flex justify-between items-center">
                <span className="text-xs text-white bg-black/50 px-2 py-1 rounded-full">
                  {formatTime(recordingDuration)}
                </span>
                <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
              </div>
            )}
          </div>
        )}
        
        {/* Controls */}
        <div className="flex justify-center w-full">
          {state === 'preview' ? (
            <div className="flex gap-4">
              <Button 
                variant="outline"
                onClick={resetRecording}
                className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.outline}`}
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Retry
              </Button>
              <Button 
                onClick={acceptRecording}
                className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
              >
                <Check className="w-4 h-4 mr-2" /> Accept
              </Button>
            </div>
          ) : state === 'recording' ? (
            <Button 
              onClick={stopRecording}
              variant="destructive"
              className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
            >
              <Square className="w-4 h-4 mr-2" /> Stop Recording
            </Button>
          ) : (
            <Button 
              onClick={startRecording}
              className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
            >
              <Video className="w-4 h-4 mr-2" /> Start Recording
            </Button>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-4 flex justify-end">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onCancel}
          className={HOVER_TRANSITION}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
