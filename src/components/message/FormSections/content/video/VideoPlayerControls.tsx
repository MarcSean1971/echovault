
import { Button } from "@/components/ui/button";
import { Pause, Play, Captions, Trash2 } from "lucide-react";

interface VideoPlayerControlsProps {
  isPlaying: boolean;
  togglePlayback: () => void;
  handleTranscribe: () => Promise<void>;
  isTranscribing: boolean;
  onClearVideo: () => void;
}

export function VideoPlayerControls({
  isPlaying,
  togglePlayback,
  handleTranscribe,
  isTranscribing,
  onClearVideo
}: VideoPlayerControlsProps) {
  return (
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
  );
}
