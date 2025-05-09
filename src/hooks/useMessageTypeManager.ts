
import { useVideoRecordingHandler } from "./useVideoRecordingHandler";
import { useMessageTypeHandler } from "./useMessageTypeHandler";
import { useMessageForm } from "@/components/message/MessageFormContext";

export function useMessageTypeManager() {
  const { setMessageType: setContextMessageType } = useMessageForm();
  
  const {
    videoBlob, videoBase64, videoTranscription, setShowVideoRecorder
  } = useVideoRecordingHandler();
  
  const {
    messageType, setMessageType,
    handleTextTypeClick, handleVideoTypeClick
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
  
  const onVideoTypeClick = () => {
    // Always show the video recorder when clicking video type
    handleVideoTypeClick(setShowVideoRecorder, videoBlob);
    handleMessageTypeChange("video");
  };

  return {
    messageType,
    onTextTypeClick,
    onVideoTypeClick
  };
}
