
import { Button } from "@/components/ui/button";
import { AudioPlayer } from "@/components/media/AudioPlayer";
import { BUTTON_HOVER_EFFECTS, HOVER_TRANSITION } from "@/utils/hoverEffects";
import { Spinner } from "@/components/ui/spinner";
import { Mic } from "lucide-react";

interface AudioContentProps {
  audioUrl: string | null;
  audioTranscription?: string | null;
  isTranscribingAudio?: boolean;
  onRecordClick: () => void;
  onClearAudio: () => void;
  setShowAudioRecorder: (show: boolean) => void;
}

export function AudioContent({ 
  audioUrl, 
  audioTranscription, 
  isTranscribingAudio = false,
  onRecordClick, 
  onClearAudio,
  setShowAudioRecorder
}: AudioContentProps) {
  const handleOpenRecorder = () => {
    console.log("Opening audio recorder from AudioContent");
    setShowAudioRecorder(true);
  };
  
  if (audioUrl) {
    return (
      <div className="space-y-3">
        <AudioPlayer src={audioUrl} />
        
        {/* Transcription section */}
        {isTranscribingAudio && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner size="sm" className="h-4 w-4" />
            <span>Transcribing audio...</span>
          </div>
        )}
        
        {audioTranscription && !isTranscribingAudio && (
          <div className="bg-muted/30 p-3 rounded-md">
            <p className="text-sm font-medium mb-1">Transcription:</p>
            <p className="text-sm italic">{audioTranscription}</p>
          </div>
        )}
        
        <div className="flex justify-end">
          <Button 
            type="button"
            size="sm" 
            variant="outline" 
            onClick={handleOpenRecorder}
            className={`mr-2 ${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.outline}`}
          >
            Record New
          </Button>
          <Button 
            type="button"
            size="sm" 
            variant="destructive" 
            onClick={onClearAudio}
            className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
          >
            Clear Audio
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center h-[150px] border-2 border-dashed rounded-md border-gray-300 bg-gray-50 p-6">
      <Button 
        type="button"
        onClick={handleOpenRecorder}
        className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
      >
        <Mic className="mr-2 h-4 w-4" /> Record Audio Message
      </Button>
    </div>
  );
}
