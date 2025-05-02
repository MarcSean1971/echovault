
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Video, VideoOff, Play, Pause, Stop, Trash2, Check } from "lucide-react";

interface VideoRecorderProps {
  onVideoReady: (videoBlob: Blob, videoBase64: string) => void;
  onCancel: () => void;
}

export function VideoRecorder({ onVideoReady, onCancel }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const recordedVideoRef = useRef<HTMLVideoElement | null>(null);

  // Check for browser support
  useEffect(() => {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setIsBrowserSupported(false);
      toast({
        title: "Browser Not Supported",
        description: "Your browser doesn't support video recording functionality.",
        variant: "destructive"
      });
    }
    
    return () => {
      // Clean up resources when component unmounts
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = null;
        
        if (isRecording) {
          mediaRecorderRef.current.stop();
        }
      }
      
      if (videoURL) {
        URL.revokeObjectURL(videoURL);
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isRecording, videoURL, stream]);
  
  // Initialize webcam stream
  const initCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      setStream(mediaStream);
      
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = mediaStream;
        videoPreviewRef.current.play();
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast({
        title: "Camera Access Failed",
        description: "Could not access your camera or microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };
  
  useEffect(() => {
    if (isBrowserSupported) {
      initCamera();
    }
  }, [isBrowserSupported]);
  
  const startRecording = () => {
    if (!stream) return;
    
    videoChunksRef.current = [];
    
    try {
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(videoBlob);
        setVideoURL(url);
        setVideoBlob(videoBlob);
      };
      
      // Start recording and update state
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsPaused(false);
      setRecordingDuration(0);
      
      // Start the timer
      timerRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error starting recording:", err);
      toast({
        title: "Recording Failed",
        description: "Could not start video recording. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      
      // Pause the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };
  
  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      // Resume the timer
      timerRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      // Stop the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };
  
  const togglePlayback = () => {
    if (!recordedVideoRef.current || !videoURL) return;
    
    if (isPlaying) {
      recordedVideoRef.current.pause();
      setIsPlaying(false);
    } else {
      recordedVideoRef.current.play();
      setIsPlaying(true);
    }
  };
  
  const handleVideoEnded = () => {
    setIsPlaying(false);
  };
  
  const handleAccept = async () => {
    if (!videoBlob) return;
    
    try {
      // Revoke camera access when accepting the video
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const reader = new FileReader();
      reader.readAsDataURL(videoBlob);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        // Remove the data URL prefix (e.g., "data:video/webm;base64,")
        const base64Video = base64data.split(",")[1];
        onVideoReady(videoBlob, base64Video);
      };
    } catch (err) {
      console.error("Error processing video:", err);
      toast({
        title: "Error",
        description: "Failed to process the recorded video.",
        variant: "destructive"
      });
    }
  };
  
  const handleReset = () => {
    if (videoURL) {
      URL.revokeObjectURL(videoURL);
    }
    setVideoURL(null);
    setVideoBlob(null);
    setRecordingDuration(0);
    setIsRecording(false);
    setIsPaused(false);
    setIsPlaying(false);
    videoChunksRef.current = [];
  };
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (!isBrowserSupported) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive mb-4">Your browser doesn't support video recording.</p>
        <Button onClick={onCancel} variant="outline">Cancel</Button>
      </div>
    );
  }
  
  return (
    <div className="p-4 bg-background rounded-lg border">
      <div className="flex flex-col items-center justify-center gap-4">
        {/* Video preview or playback area */}
        <div className="w-full aspect-video bg-black rounded-md overflow-hidden relative">
          {!videoURL ? (
            // Live video preview for recording
            <>
              <video 
                ref={videoPreviewRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
              
              {isRecording && (
                <div className="absolute top-2 right-2 flex items-center px-2 py-1 bg-black/50 rounded-full">
                  <div className={`w-2 h-2 rounded-full bg-red-500 mr-1 ${isPaused ? '' : 'animate-pulse'}`} />
                  <span className="text-xs text-white">
                    {formatDuration(recordingDuration)}
                  </span>
                </div>
              )}
            </>
          ) : (
            // Recorded video playback
            <video
              ref={recordedVideoRef}
              src={videoURL}
              className="w-full h-full object-cover"
              onEnded={handleVideoEnded}
            />
          )}
        </div>
        
        {/* Controls */}
        {!videoURL ? (
          // Recording controls
          <div className="flex items-center gap-2">
            {isRecording ? (
              <>
                {isPaused ? (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={resumeRecording}
                    className="text-primary"
                  >
                    <Play className="w-4 h-4 mr-1" /> Resume
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={pauseRecording}
                    className="text-muted-foreground"
                  >
                    <Pause className="w-4 h-4 mr-1" /> Pause
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={stopRecording}
                >
                  <Stop className="w-4 h-4 mr-1" /> Stop
                </Button>
              </>
            ) : (
              <Button 
                onClick={startRecording}
                className="bg-primary"
              >
                <Video className="w-4 h-4 mr-1" /> Start Recording
              </Button>
            )}
          </div>
        ) : (
          // Playback controls
          <div className="flex items-center justify-between w-full">
            <Button 
              variant="outline"
              size="sm"
              onClick={togglePlayback}
            >
              {isPlaying ? (
                <><Pause className="w-4 h-4 mr-1" /> Pause</>
              ) : (
                <><Play className="w-4 h-4 mr-1" /> Play</>
              )}
            </Button>
            
            <span className="text-sm font-medium">
              {formatDuration(recordingDuration)}
            </span>
            
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleReset}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-1" /> Discard
              </Button>
              <Button 
                size="sm"
                onClick={handleAccept}
              >
                <Check className="w-4 h-4 mr-1" /> Accept
              </Button>
            </div>
          </div>
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
