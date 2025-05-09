
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { 
  Play, 
  Pause, 
  Mic, 
  MicOff, 
  Trash2, 
  Video,
  Captions
} from "lucide-react";
import { HOVER_TRANSITION, BUTTON_HOVER_EFFECTS } from "@/utils/hoverEffects";
import { useMessageForm } from "../../MessageFormContext";

export function VideoContent({ 
  videoUrl,
  isRecording,
  onStartRecording,
  onStopRecording,
  onClearVideo,
  onTranscribeVideo
}: {
  videoUrl: string | null;
  isRecording: boolean;
  onStartRecording: () => Promise<void>;
  onStopRecording: () => void;
  onClearVideo: () => void;
  onTranscribeVideo: () => Promise<void>;
}) {
  const { content, setContent } = useMessageForm();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
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
  
  return (
    <div className="space-y-4">
      <Label htmlFor="videoContent">Video Message</Label>
      
      {/* Show video preview if available */}
      {videoUrl && (
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
              className="text-white"
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
                className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
              >
                <Captions className="w-4 h-4 mr-1" />
                {isTranscribing ? "Transcribing..." : "Transcribe"}
              </Button>
              
              <Button 
                type="button" 
                size="sm" 
                variant="destructive"
                onClick={onClearVideo}
                className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.destructive}`}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Show recording controls if no video is available */}
      {!videoUrl && (
        <div className="flex flex-col items-center border-2 border-dashed border-muted-foreground/30 rounded-md p-6 space-y-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Video className="h-8 w-8 text-primary" />
          </div>
          
          <div className="text-center">
            <h3 className="font-medium">Record Video Message</h3>
            <p className="text-sm text-muted-foreground">Create a video message to accompany your text</p>
          </div>
          
          <Button
            type="button"
            onClick={isRecording ? onStopRecording : onStartRecording}
            variant={isRecording ? "destructive" : "default"}
            className={`${HOVER_TRANSITION} ${isRecording ? BUTTON_HOVER_EFFECTS.destructive : BUTTON_HOVER_EFFECTS.default}`}
          >
            {isRecording ? (
              <>
                <MicOff className="mr-2 h-4 w-4" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Start Recording
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
