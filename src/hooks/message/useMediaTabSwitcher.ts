
import { useMessageForm } from '@/components/message/MessageFormContext';

/**
 * Hook to handle media tab switching and cleanup
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
  
  // Handle clicking on text tab
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
    // but don't clear the content - this is the critical fix
    if (isVideoStreamActive()) {
      console.log("Stopping active video stream when switching to text mode");
      stopVideoStream();
    }
    
    if (isAudioStreamActive()) {
      console.log("Stopping active audio stream when switching to text mode");
      stopAudioStream();
    }
  };
  
  // Handle clicking on video tab
  const onVideoTypeClick = () => {
    console.log("Video message type selected");
    setMessageType('video');
    
    // If we were recording audio, stop
    if (isAudioRecording) {
      stopAudioRecording();
    }
    
    // Stop any active audio streams when switching to video mode
    if (isAudioStreamActive()) {
      console.log("Stopping active audio stream when switching to video mode");
      stopAudioStream();
    }
  };
  
  // Handle clicking on audio tab
  const onAudioTypeClick = () => {
    console.log("Audio message type selected");
    setMessageType('audio');
    
    // If we were recording video, stop
    if (isVideoRecording) {
      stopVideoRecording();
    }
    
    // Stop any active video streams when switching to audio mode
    if (isVideoStreamActive()) {
      console.log("Stopping active video stream when switching to audio mode");
      stopVideoStream();
    }
  };
  
  return {
    onTextTypeClick,
    onVideoTypeClick,
    onAudioTypeClick
  };
}
