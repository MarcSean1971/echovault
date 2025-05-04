
import { Label } from "@/components/ui/label";
import { useMessageForm } from "../MessageFormContext";
import { FileUploader } from "@/components/FileUploader";
import { AudioRecorderDialog } from "@/components/media/AudioRecorderDialog";
import { VideoRecorderDialog } from "@/components/media/VideoRecorderDialog";
import { BUTTON_HOVER_EFFECTS, HOVER_TRANSITION } from "@/utils/hoverEffects";

// Import our new components
import { TitleInput } from "./TitleInput";
import { MessageTypeSelector } from "./MessageTypeSelector";
import { TextContent } from "./content/TextContent";
import { AudioContent } from "./content/AudioContent";
import { VideoContent } from "./content/VideoContent";
import { LocationSection } from "./LocationSection";

// Import custom hooks
import { useAudioRecordingHandler } from "@/hooks/useAudioRecordingHandler";
import { useVideoRecordingHandler } from "@/hooks/useVideoRecordingHandler";
import { useMessageTypeHandler } from "@/hooks/useMessageTypeHandler";

export function MessageDetails() {
  const { 
    content, setContent, 
    setMessageType: setContextMessageType,
    files, setFiles
  } = useMessageForm();
  
  // Use our custom hooks
  const {
    showAudioRecorder, setShowAudioRecorder,
    audioBlob, audioUrl,
    isTranscribingAudio, audioTranscription,
    handleAudioReady, clearAudio
  } = useAudioRecordingHandler();
  
  const {
    showVideoRecorder, setShowVideoRecorder,
    videoBlob, videoUrl,
    isTranscribingVideo, videoTranscription,
    handleVideoReady, clearVideo
  } = useVideoRecordingHandler();
  
  const {
    messageType, setMessageType,
    handleAudioTypeClick, handleVideoTypeClick
  } = useMessageTypeHandler();
  
  // Sync our local messageType with the context
  const handleMessageTypeChange = (type: string) => {
    setMessageType(type);
    setContextMessageType(type);
  };
  
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
  
  // Handle type selection with our custom hooks
  const onAudioTypeClick = () => {
    handleAudioTypeClick(setShowAudioRecorder, audioBlob);
    handleMessageTypeChange("audio");
  };
  
  const onVideoTypeClick = () => {
    handleVideoTypeClick(setShowVideoRecorder, videoBlob);
    handleMessageTypeChange("video");
  };

  return (
    <div className="space-y-6">
      {/* Title field */}
      <TitleInput />

      {/* Message type selector */}
      <MessageTypeSelector 
        onAudioTypeClick={onAudioTypeClick}
        onVideoTypeClick={onVideoTypeClick}
      />

      {/* Content field based on message type */}
      <div className="space-y-2">
        {messageType === "text" ? (
          <TextContent />
        ) : messageType === "audio" ? (
          <AudioContent 
            audioUrl={audioUrl}
            audioTranscription={audioTranscription}
            isTranscribingAudio={isTranscribingAudio}
            onRecordClick={() => setShowAudioRecorder(true)}
            onClearAudio={handleClearAudio}
          />
        ) : messageType === "video" ? (
          <VideoContent 
            videoUrl={videoUrl}
            videoTranscription={videoTranscription}
            isTranscribingVideo={isTranscribingVideo}
            onRecordClick={() => setShowVideoRecorder(true)}
            onClearVideo={handleClearVideo}
          />
        ) : (
          <div className="p-4 bg-muted rounded-md text-center">
            Please select a message type
          </div>
        )}
      </div>

      {/* Location section */}
      <LocationSection />

      {/* File attachments */}
      <div className="space-y-2">
        <Label>File Attachments</Label>
        <FileUploader 
          files={files} 
          onChange={setFiles} 
        />
      </div>

      {/* Audio Recorder Dialog */}
      <AudioRecorderDialog 
        open={showAudioRecorder} 
        onOpenChange={setShowAudioRecorder} 
        onAudioReady={handleAudioContentUpdate}
      />
      
      {/* Video Recorder Dialog */}
      <VideoRecorderDialog 
        open={showVideoRecorder} 
        onOpenChange={setShowVideoRecorder} 
        onVideoReady={handleVideoContentUpdate}
      />
    </div>
  );
}
