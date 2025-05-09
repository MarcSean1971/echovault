
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/media/VideoPlayer";
import { BUTTON_HOVER_EFFECTS, HOVER_TRANSITION } from "@/utils/hoverEffects";
import { AlertCircle, Video, Camera } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

interface VideoContentProps {
  videoUrl: string | null;
  videoTranscription: string | null;
  isTranscribingVideo: boolean;
  onRecordClick: () => void;
  onClearVideo: () => void;
  setShowVideoRecorder: (show: boolean) => void;
}

export function VideoContent({ 
  videoUrl, 
  videoTranscription, 
  isTranscribingVideo, 
  onRecordClick, 
  onClearVideo,
  setShowVideoRecorder
}: VideoContentProps) {
  const handleOpenRecorder = () => {
    console.log("Opening video recorder from VideoContent");
    setShowVideoRecorder(true);
  };
  
  if (videoUrl) {
    return (
      <div className="space-y-3">
        <VideoPlayer src={videoUrl} className="w-full aspect-video" />
        
        {videoTranscription && !isTranscribingVideo && (
          <div className="mt-4 p-3 border rounded-lg bg-muted/30">
            <h4 className="font-medium mb-1">Transcription:</h4>
            <p className="text-sm italic">"{videoTranscription}"</p>
          </div>
        )}
        
        {isTranscribingVideo && (
          <div className="p-3 border rounded-lg bg-blue-50 flex items-center gap-2">
            <Spinner className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-700">Transcribing video...</span>
          </div>
        )}
        
        <div className="flex justify-end">
          <Button 
            type="button"
            size="sm" 
            variant="outline" 
            onClick={handleOpenRecorder}
            className={`mr-2 ${HOVER_TRANSITION} hover:scale-105 ${BUTTON_HOVER_EFFECTS.outline}`}
          >
            Record New
          </Button>
          <Button 
            type="button"
            size="sm" 
            variant="destructive" 
            onClick={onClearVideo}
            className={`${HOVER_TRANSITION} hover:scale-105 ${BUTTON_HOVER_EFFECTS.default}`}
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
        <Video className="h-12 w-12 text-muted-foreground mx-auto mb-2 hover:scale-110 transition-all duration-200" />
        <p className="text-sm text-muted-foreground mb-1">
          Record a video message
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          <AlertCircle className="inline mr-1 h-3 w-3" />
          Make sure your camera and microphone are connected
        </p>
      </div>
      <Button 
        type="button"
        onClick={handleOpenRecorder}
        className={`${HOVER_TRANSITION} hover:scale-105 ${BUTTON_HOVER_EFFECTS.default}`}
      >
        <Camera className="mr-2 h-4 w-4" /> Record Video Message
      </Button>
    </div>
  );
}
