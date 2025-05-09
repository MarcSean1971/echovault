
import { useAudioRecordingHandler } from "./useAudioRecordingHandler";
import { useVideoRecordingHandler } from "./useVideoRecordingHandler";
import { useMessageForm } from "@/components/message/MessageFormContext";

export function useContentUpdater() {
  const { setContent } = useMessageForm();
  
  const {
    handleAudioReady, clearAudio
  } = useAudioRecordingHandler();
  
  const {
    handleVideoReady, clearVideo
  } = useVideoRecordingHandler();

  // Wrapper functions to handle content updates
  const handleAudioContentUpdate = async (audioBlob: Blob, audioBase64: string) => {
    const contentData = await handleAudioReady(audioBlob, audioBase64);
    setContent(JSON.stringify(contentData));
  };
  
  const handleVideoContentUpdate = async (videoBlob: Blob, videoBase64: string) => {
    const contentData = await handleVideoReady(videoBlob, videoBase64);
    setContent(JSON.stringify(contentData));
  };
  
  const handleClearAudio = () => {
    const emptyContent = clearAudio();
    setContent(emptyContent);
  };
  
  const handleClearVideo = () => {
    const emptyContent = clearVideo();
    setContent(emptyContent);
  };

  return {
    handleAudioContentUpdate,
    handleVideoContentUpdate,
    handleClearAudio,
    handleClearVideo
  };
}
