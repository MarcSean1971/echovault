
import { useMessageForm } from '@/components/message/MessageFormContext';

/**
 * Hook to handle media tab switching and cleanup
 * This is a simplified version that only works with text content
 */
export function useMediaTabSwitcher(
  isVideoRecording: boolean,
  stopVideoRecording: () => void,
  stopVideoStream: () => void,
  isVideoStreamActive: () => boolean,
  isAudioRecording: boolean,
  stopAudioRecording: () => void,
  stopAudioStream: () => void,
  isAudioStreamActive: () => boolean
) {
  const { setMessageType } = useMessageForm();
  
  // Handle clicking on text tab (the only option in this version)
  const onTextTypeClick = () => {
    console.log("Text message type selected");
    setMessageType('text');
    
    // If we were recording video, stop
    if (isVideoRecording) {
      stopVideoRecording();
    }
    
    // If we were recording audio, stop
    if (isAudioRecording) {
      stopAudioRecording();
    }
    
    // Stop any active media streams when switching to text mode
    if (isVideoStreamActive()) {
      console.log("Stopping active video stream when switching to text mode");
      stopVideoStream();
    }
    
    if (isAudioStreamActive()) {
      console.log("Stopping active audio stream when switching to text mode");
      stopAudioStream();
    }
    
    console.log("Keeping video and audio content when switching to text mode");
  };
  
  // These functions are kept for API compatibility but only support text
  const onVideoTypeClick = () => {
    console.log("Video message type is not supported in this version");
    onTextTypeClick(); // Fallback to text mode
  };
  
  // Handle clicking on audio tab - not supported, fallback to text
  const onAudioTypeClick = () => {
    console.log("Audio message type is not supported in this version");
    onTextTypeClick(); // Fallback to text mode
  };
  
  return {
    onTextTypeClick,
    onVideoTypeClick,
    onAudioTypeClick
  };
}
