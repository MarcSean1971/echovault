
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/media/VideoPlayer";
import { BUTTON_HOVER_EFFECTS, HOVER_TRANSITION } from "@/utils/hoverEffects";
import { AlertCircle } from "lucide-react";

interface VideoContentProps {
  videoUrl: string | null;
  videoTranscription: string | null;
  isTranscribingVideo: boolean;
  onRecordClick: () => void;
  onClearVideo: () => void;
}

export function VideoContent({ 
  videoUrl, 
  videoTranscription, 
  isTranscribingVideo, 
  onRecordClick, 
  onClearVideo 
}: VideoContentProps) {
  if (videoUrl) {
    return (
      <div className="space-y-3">
        <VideoPlayer src={videoUrl} className="w-full aspect-video" />
        
        {videoTranscription && (
          <div className="mt-4 p-3 border rounded-lg bg-muted/30">
            <h4 className="font-medium mb-1">Transcription:</h4>
            <p className="text-sm italic">"{videoTranscription}"</p>
          </div>
        )}
        
        {isTranscribingVideo && (
          <div className="flex items-center justify-center p-3">
            <div className="animate-pulse text-sm">Transcribing video...</div>
          </div>
        )}
        
        <div className="flex justify-end">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onRecordClick}
            className={`mr-2 ${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.outline}`}
          >
            Record New
          </Button>
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={onClearVideo}
            className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
          >
            Clear Video
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center h-[200px] border-2 border-dashed rounded-md border-gray-300 bg-gray-50 p-6">
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground mb-2">
          <AlertCircle className="inline mr-1 h-4 w-4" />
          Make sure your camera and microphone are connected
        </p>
      </div>
      <Button 
        onClick={onRecordClick}
        className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
      >
        Record Video Message
      </Button>
    </div>
  );
}
