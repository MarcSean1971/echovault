
import { Label } from "@/components/ui/label";
import { useMessageForm } from "../MessageFormContext";
import { FileUploader } from "@/components/FileUploader";

// Import our components
import { TitleInput } from "./TitleInput";
import { MessageTypeSelector } from "./MessageTypeSelector";
import { TextContent } from "./content/TextContent";
import { VideoContent } from "./content/VideoContent";
import { LocationSection } from "./LocationSection";
import { MediaRecorders } from "./MessageDetailsComponents/MediaRecorders";

// Import custom hooks
import { useVideoRecordingHandler } from "@/hooks/useVideoRecordingHandler";
import { useMessageInitializer } from "@/hooks/useMessageInitializer";
import { useContentUpdater } from "@/hooks/useContentUpdater";
import { useMessageTypeManager } from "@/hooks/useMessageTypeManager";

interface MessageDetailsProps {
  message?: any;  // Optional message prop for editing
}

export function MessageDetails({ message }: MessageDetailsProps) {
  const { files, setFiles } = useMessageForm();
  
  // Use our custom hooks
  const {
    videoUrl, videoTranscription, isTranscribingVideo,
    showVideoRecorder, setShowVideoRecorder, videoBlob
  } = useVideoRecordingHandler();
  
  const {
    messageType, onTextTypeClick, onVideoTypeClick
  } = useMessageTypeManager();

  const {
    handleVideoContentUpdate,
    handleClearVideo
  } = useContentUpdater();

  // Initialize message data when editing an existing message
  useMessageInitializer(message);

  return (
    <div className="space-y-6">
      {/* Title field */}
      <TitleInput />

      {/* Message type selector */}
      <MessageTypeSelector 
        onTextTypeClick={onTextTypeClick}
        onVideoTypeClick={onVideoTypeClick}
      />

      {/* Content field based on message type */}
      <div className="space-y-2">
        {messageType === "text" ? (
          <TextContent />
        ) : messageType === "video" ? (
          <VideoContent 
            videoUrl={videoUrl}
            videoTranscription={videoTranscription}
            isTranscribingVideo={isTranscribingVideo}
            onRecordClick={() => onVideoTypeClick()}
            onClearVideo={handleClearVideo}
            setShowVideoRecorder={setShowVideoRecorder}
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

      {/* Media recorder dialogs */}
      <MediaRecorders 
        showVideoRecorder={showVideoRecorder}
        setShowVideoRecorder={setShowVideoRecorder}
        onVideoContentUpdate={handleVideoContentUpdate}
        videoUrl={videoUrl}
        videoBlob={videoBlob}
      />
    </div>
  );
}
