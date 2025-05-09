
import { useAudioRecordingHandler } from "./useAudioRecordingHandler";
import { useVideoRecordingHandler } from "./useVideoRecordingHandler";
import { useMessageTypeHandler } from "./useMessageTypeHandler";
import { useMessageForm } from "@/components/message/MessageFormContext";

export function useMessageTypeManager() {
  const { setMessageType: setContextMessageType } = useMessageForm();
  
  const {
    audioBlob, audioBase64, audioTranscription, setShowAudioRecorder
  } = useAudioRecordingHandler();
  
  const {
    videoBlob, videoBase64, videoTranscription, setShowVideoRecorder
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
  };

  // Handle type selection with our custom hooks
  const onAudioTypeClick = () => {
    // Always show the audio recorder when clicking audio type
    handleAudioTypeClick(setShowAudioRecorder, audioBlob);
    handleMessageTypeChange("audio");
  };
  
  const onVideoTypeClick = () => {
    // Always show the video recorder when clicking video type
    handleVideoTypeClick(setShowVideoRecorder, videoBlob);
    handleMessageTypeChange("video");
  };

  return {
    messageType,
    onTextTypeClick,
    onAudioTypeClick,
    onVideoTypeClick
  };
}
