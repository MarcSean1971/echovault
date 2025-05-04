
import { toast } from "@/components/ui/use-toast";
import { getOptimalMimeType } from "./audioUtils";

interface SetupMediaRecorderParams {
  stream: MediaStream;
  onDataAvailable: (event: BlobEvent) => void;
  onStart: () => void;
  onError: (event: Event) => void;
  onStop: () => void;
}

/**
 * Creates and configures a new MediaRecorder instance
 */
export function setupMediaRecorder({
  stream,
  onDataAvailable,
  onStart,
  onError,
  onStop
}: SetupMediaRecorderParams): MediaRecorder {
  // Create new MediaRecorder instance with optimal mime type
  const mimeType = getOptimalMimeType();
  console.log("Using MIME type:", mimeType);
  
  const mediaRecorder = new MediaRecorder(stream, { mimeType });
  
  console.log("MediaRecorder created:", mediaRecorder);
  
  // Set up event handlers
  mediaRecorder.ondataavailable = onDataAvailable;
  mediaRecorder.onstart = onStart;
  
  mediaRecorder.onerror = (event) => {
    console.error("MediaRecorder error:", event);
    toast({
      title: "Recording Error",
      description: "An error occurred while recording audio.",
      variant: "destructive"
    });
    onError(event);
  };
  
  mediaRecorder.onstop = onStop;
  
  return mediaRecorder;
}
