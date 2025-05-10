
import { Button } from "@/components/ui/button";
import { Play, Pause, Trash2 } from "lucide-react";

interface VideoPlayerControlsProps {
  isPlaying: boolean;
  togglePlayback: () => void;
  onClearVideo: () => void;
  inDialog?: boolean;
  isVisible?: boolean;
}

export function VideoPlayerControls({
  isPlaying,
  togglePlayback,
  onClearVideo,
  inDialog = false,
  isVisible = true
}: VideoPlayerControlsProps) {
  return (
    <div 
      className={`absolute bottom-0 left-0 right-0 p-3 flex justify-between items-center bg-gradient-to-t from-black/70 to-transparent 
        transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={(e) => e.stopPropagation()}
    >
      <Button 
        variant="default" 
        size="icon" 
        onClick={togglePlayback}
        className="bg-white/20 hover:bg-white/40 backdrop-blur-sm hover:scale-105 transition-all duration-200"
      >
        {isPlaying ? (
          <Pause className="h-4 w-4 text-white hover:text-white/90 transition-colors" />
        ) : (
          <Play className="h-4 w-4 text-white hover:text-white/90 transition-colors" />
        )}
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onClearVideo}
        className="bg-white/20 hover:bg-destructive/90 hover:text-destructive-foreground backdrop-blur-sm hover:scale-105 transition-all duration-200"
      >
        <Trash2 className="h-4 w-4 mr-1 hover:text-destructive-foreground transition-colors" />
        Clear
      </Button>
    </div>
  );
}
