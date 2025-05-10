
import { useState, useEffect } from "react";

export function useMediaHandlers(clearVideo: () => void, setShowVideoRecorder: (show: boolean) => void) {
  const [showInlineRecording, setShowInlineRecording] = useState(false);

  // Handle clearing video and showing record dialog
  const handleClearVideoAndRecord = () => {
    console.log("Clearing video and showing recording interface");
    clearVideo();
    
    // Show the inline recording UI after clearing the video
    // This is critical for edit mode to show the recording interface after clearing
    setTimeout(() => {
      console.log("Setting showInlineRecording to true after clearing video");
      setShowInlineRecording(true);
    }, 100);
    
    // For dialog mode, use this instead
    if (setShowVideoRecorder) {
      // Show the dialog after a slight delay to ensure state updates
      setTimeout(() => {
        setShowVideoRecorder(true);
      }, 50);
    }
  };
  
  // Debug log state changes
  useEffect(() => {
    console.log("MediaHandlers: showInlineRecording =", showInlineRecording);
  }, [showInlineRecording]);

  return {
    showInlineRecording,
    setShowInlineRecording,
    handleClearVideoAndRecord
  };
}
