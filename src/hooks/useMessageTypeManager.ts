
import { useMessageTypeHandler } from "./useMessageTypeHandler";
import { useMessageForm } from "@/components/message/MessageFormContext";

export function useMessageTypeManager() {
  const { setMessageType: setContextMessageType } = useMessageForm();
  
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
    // Stub for removed video functionality
    console.log("Video functionality has been removed");
    handleVideoTypeClick();
    handleMessageTypeChange("text"); // Default to text since video is removed
  };

  return {
    messageType,
    onTextTypeClick,
    onVideoTypeClick
  };
}
