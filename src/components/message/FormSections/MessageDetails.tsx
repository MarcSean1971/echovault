
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
    messageType, onTextTypeClick, onVideoTypeClick,
    videoBlob, videoUrl, showVideoRecorder, setShowVideoRecorder,
    startRecording, stopRecording, clearVideo 
  } = useMessageTypeManager();
  
  const { handleVideoContentUpdate, isTranscribingVideo } = useContentUpdater();
  
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
      <div className="space-y-4">
        {/* Text content is always shown */}
        <TextContent />
        
        {/* Video content is shown when video type is selected */}
        {messageType === "video" && (
          <VideoContent
            videoUrl={videoUrl}
            isRecording={false}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onClearVideo={clearVideo}
            onTranscribeVideo={async () => {
              if (videoBlob) {
                return handleVideoContentUpdate(videoBlob);
              }
              return Promise.resolve({});
            }}
          />
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
        isRecording={false}
        startRecording={startRecording}
        stopRecording={stopRecording}
        clearVideo={clearVideo}
      />
    </div>
  );
}
