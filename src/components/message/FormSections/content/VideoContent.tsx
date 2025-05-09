
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { 
  Play, 
  Pause, 
  Camera, 
  CameraOff, 
  Trash2, 
  Video,
  Captions
} from "lucide-react";
import { HOVER_TRANSITION, BUTTON_HOVER_EFFECTS } from "@/utils/hoverEffects";
import { useMessageForm } from "../../MessageFormContext";

export function VideoContent({ 
  videoUrl,
  isRecording,
  isInitializing,
  hasPermission,
  previewStream,
  onStartRecording,
  onStopRecording,
  onClearVideo,
  onTranscribeVideo,
  inDialog = false
}: {
  videoUrl: string | null;
  isRecording: boolean;
  isInitializing?: boolean;
  hasPermission?: boolean | null;
  previewStream?: MediaStream | null;
  onStartRecording: () => Promise<void>;
  onStopRecording: () => void;
  onClearVideo: () => void;
  onTranscribeVideo: () => Promise<void>;
  inDialog?: boolean;
}) {
  const { content } = useMessageForm();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  
  // Log for debugging
  useEffect(() => {
    console.log("VideoContent: inDialog =", inDialog, 
                "videoUrl =", videoUrl ? "present" : "null",
                "previewStream =", previewStream ? "active" : "null");
    
    // If we have a video URL, we should show the video preview
    if (videoUrl) {
      setShowVideoPreview(true);
    }
  }, [inDialog, videoUrl, previewStream]);
  
  // Connect preview stream to video element
  useEffect(() => {
    if (previewStream && previewRef.current && !videoUrl) {
      console.log("Connecting preview stream to video element");
      previewRef.current.srcObject = previewStream;
      
      // Play the preview (will be silent since we're not enabling audio)
      previewRef.current.play().catch(err => {
        console.error("Error playing preview:", err);
      });
    }
    
    return () => {
      if (previewRef.current) {
        previewRef.current.srcObject = null;
      }
    };
  }, [previewStream, videoUrl]);
  
  // Toggle video playback
  const togglePlayback = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Handle transcription
  const handleTranscribe = async () => {
    setIsTranscribing(true);
    try {
      await onTranscribeVideo();
      toast({
        title: "Transcription completed",
        description: "Video has been transcribed successfully"
      });
    } catch (error) {
      toast({
        title: "Transcription failed",
        description: "Unable to transcribe the video. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsTranscribing(false);
    }
  };
  
  // Handle recording with better error handling
  const handleStartRecording = async () => {
    setPermissionError(null);
    try {
      console.log("Starting recording...");
      await onStartRecording();
      console.log("Recording started successfully");
    } catch (error: any) {
      console.error("Error starting recording:", error);
      setPermissionError(error.message || "Unable to access camera or microphone");
    }
  };
  
  return (
    <div className="space-y-4">
      {!inDialog && <Label htmlFor="videoContent">Video Message</Label>}
      
      {/* Show video preview if available */}
      {videoUrl && showVideoPreview && (
        <div className="relative rounded-md overflow-hidden bg-black">
          <video 
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full max-h-[300px]"
            onEnded={() => setIsPlaying(false)}
          />
          
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 flex justify-between items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={togglePlayback}
              className="text-white hover:bg-white/20 transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? "Pause" : "Play"}
            </Button>
            
            <div className="flex gap-2">
              <Button 
                type="button"
                size="sm"
                variant="outline"
                onClick={handleTranscribe}
                disabled={isTranscribing}
                className="hover:bg-primary/90 transition-colors"
              >
                <Captions className="w-4 h-4 mr-1" />
                {isTranscribing ? "Transcribing..." : "Transcribe"}
              </Button>
              
              <Button 
                type="button" 
                size="sm" 
                variant="destructive"
                onClick={onClearVideo}
                className="hover:bg-destructive/90 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Show preview stream if no recorded video */}
      {!videoUrl && previewStream && !isRecording && (
        <div className="relative rounded-md overflow-hidden bg-black">
          <video 
            ref={previewRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full max-h-[300px]"
          />
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 flex justify-center">
            <Button
              type="button"
              onClick={handleStartRecording}
              variant="default"
              disabled={isInitializing}
              className="hover:bg-primary/90 transition-colors"
            >
              <Camera className="mr-2 h-4 w-4" />
              {isInitializing ? "Preparing..." : "Start Recording"}
            </Button>
          </div>
        </div>
      )}
      
      {/* Show recording controls if we're recording */}
      {!videoUrl && isRecording && (
        <div className="relative rounded-md overflow-hidden bg-black">
          <video 
            ref={previewRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full max-h-[300px]"
          />
          <div className="absolute top-0 left-0 right-0 p-2 bg-black/30 flex justify-center">
            <div className="flex items-center justify-center gap-2 text-white">
              <span className="animate-pulse h-3 w-3 rounded-full bg-red-500"></span>
              <span className="text-sm font-medium">Recording in progress...</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 flex justify-center">
            <Button
              type="button"
              onClick={onStopRecording}
              variant="destructive"
              className="hover:bg-destructive/90 transition-colors"
            >
              <CameraOff className="mr-2 h-4 w-4" />
              Stop Recording
            </Button>
          </div>
        </div>
      )}
      
      {/* Show initial setup UI if we have no video and no preview stream */}
      {!videoUrl && !previewStream && !isRecording && (
        <div className={`flex flex-col items-center ${!inDialog ? "border-2 border-dashed border-muted-foreground/30" : ""} rounded-md p-6 space-y-4`}>
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Video className="h-8 w-8 text-primary" />
          </div>
          
          <div className="text-center">
            <h3 className="font-medium">Record Video Message</h3>
            <p className="text-sm text-muted-foreground">Create a video message to accompany your text</p>
          </div>
          
          {permissionError && (
            <div className="bg-destructive/10 p-3 rounded-md text-sm text-destructive">
              {permissionError}
            </div>
          )}
          
          {hasPermission === false && (
            <div className="bg-destructive/10 p-3 rounded-md text-sm text-destructive">
              Camera access was denied. Please check your browser permissions.
            </div>
          )}
          
          <Button
            type="button"
            onClick={handleStartRecording}
            variant="default"
            disabled={isInitializing}
            className="hover:opacity-90 transition-all"
          >
            {isInitializing ? (
              <>
                <CameraOff className="mr-2 h-4 w-4" />
                Preparing Camera...
              </>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                Enable Camera
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
