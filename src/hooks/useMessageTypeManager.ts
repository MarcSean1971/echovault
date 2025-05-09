
import { useMessageTypeHandler } from "./useMessageTypeHandler";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { useVideoRecordingHandler } from "./useVideoRecordingHandler";

export function useMessageTypeManager() {
  const { setMessageType: setContextMessageType } = useMessageForm();
  const {
    messageType, setMessageType,
    handleTextTypeClick, handleMediaTypeClick
  } = useMessageTypeHandler();
  
  const {
    isRecording,
    videoBlob, 
    videoUrl,
    showVideoRecorder,
    setShowVideoRecorder,
    startRecording,
    stopRecording,
    clearVideo
  } = useVideoRecordingHandler();

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
    handleMediaTypeClick();
    setShowVideoRecorder(true);
    if (messageType !== "video") {
      handleMessageTypeChange("video");
    }
  };

  return {
    messageType,
    onTextTypeClick,
    onVideoTypeClick,
    isRecording,
    videoBlob,
    videoUrl,
    showVideoRecorder,
    setShowVideoRecorder,
    startRecording,
    stopRecording,
    clearVideo
  };
}
