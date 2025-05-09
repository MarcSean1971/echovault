
import { useAudioRecordingHandler } from "./useAudioRecordingHandler";
import { useVideoRecordingHandler } from "./useVideoRecordingHandler";
import { useMessageTypeHandler } from "./useMessageTypeHandler";
import { useMessageForm } from "@/components/message/MessageFormContext";

export function useMessageTypeManager() {
  const { setMessageType: setContextMessageType } = useMessageForm();
  
  const {
    audioBase64, audioTranscription, setShowAudioRecorder
  } = useAudioRecordingHandler();
  
  const {
    videoBase64, videoTranscription, setShowVideoRecorder
  } = useVideoRecordingHandler();
  
  const {
    messageType, setMessageType,
    handleTextTypeClick, handleAudioTypeClick, handleVideoTypeClick
  } = useMessageTypeHandler();

  // Wrapper functions for message type handling
  const onTextTypeClick = () => {
    handleTextTypeClick();
    handleMessageTypeChange("text");
  };
  
  // Sync our local messageType with the context
  const handleMessageTypeChange = (type: string) => {
    setMessageType(type);
    setContextMessageType(type);
    
    // When changing message type, ensure content is properly formatted
    if (type === "audio" && audioBase64) {
      // Format content as JSON with audioData
      const contentData = {
        audioData: audioBase64,
        transcription: audioTranscription
      };
      // No need to call setContent here as that will be done in the message type handler
    } else if (type === "video" && videoBase64) {
      // Format content as JSON with videoData
      const contentData = {
        videoData: videoBase64,
        transcription: videoTranscription
      };
      // No need to call setContent here as that will be done in the message type handler
    }
  };

  // Handle type selection with our custom hooks
  const onAudioTypeClick = () => {
    handleAudioTypeClick(setShowAudioRecorder, audioBase64);
    handleMessageTypeChange("audio");
  };
  
  const onVideoTypeClick = () => {
    handleVideoTypeClick(setShowVideoRecorder, videoBase64);
    handleMessageTypeChange("video");
  };

  return {
    messageType,
    onTextTypeClick,
    onAudioTypeClick,
    onVideoTypeClick
  };
}
