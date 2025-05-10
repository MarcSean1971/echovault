
import { Button } from "@/components/ui/button";
import { Play, Pause, Trash2 } from "lucide-react";

interface VideoPlayerControlsProps {
  isPlaying: boolean;
  togglePlayback: () => void;
  onClearVideo: () => void;
  inDialog?: boolean;
}

export function VideoPlayerControls({
  isPlaying,
  togglePlayback,
  onClearVideo,
  inDialog = false
}: VideoPlayerControlsProps) {
  // Prevent event bubbling
  const handleButtonClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };
  
  return (
    <div 
      className={`absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${inDialog ? "touch-auto" : ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex gap-2">
        <Button
          variant="outline"
          size={inDialog ? "lg" : "default"}
          className="bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-white/30 hover:text-white transition-colors duration-200 hover:scale-105"
          onClick={(e) => handleButtonClick(e, togglePlayback)}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>
        
        <Button
          variant="outline"
          size={inDialog ? "lg" : "default"}
          className="bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-destructive hover:text-destructive-foreground transition-colors duration-200 hover:scale-105"
          onClick={(e) => handleButtonClick(e, onClearVideo)}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Always visible controls on mobile */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center md:hidden">
        <div className="flex gap-2 bg-black/50 backdrop-blur-sm p-2 rounded-full">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 hover:text-white transition-colors duration-200 h-10 w-10"
            onClick={(e) => handleButtonClick(e, togglePlayback)}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-destructive/90 hover:text-white transition-colors duration-200 h-10 w-10"
            onClick={(e) => handleButtonClick(e, onClearVideo)}
          >
            <Trash2 className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
