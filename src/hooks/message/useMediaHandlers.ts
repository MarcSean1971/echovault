
import { useState } from "react";

export function useMediaHandlers(clearVideo: () => void, setShowVideoRecorder: (show: boolean) => void) {
  const [showInlineRecording, setShowInlineRecording] = useState(false);

  // Handle clearing video and showing record dialog
  const handleClearVideoAndRecord = () => {
    clearVideo();
    setShowInlineRecording(false);
    // Show the dialog after a slight delay to ensure state updates
    setTimeout(() => {
      setShowVideoRecorder(true);
    }, 50);
  };

  return {
    showInlineRecording,
    setShowInlineRecording,
    handleClearVideoAndRecord
  };
}
