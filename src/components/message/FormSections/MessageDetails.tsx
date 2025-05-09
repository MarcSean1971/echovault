
import { Label } from "@/components/ui/label";
import { useMessageForm } from "../MessageFormContext";
import { FileUploader } from "@/components/FileUploader";

// Import our components
import { TitleInput } from "./TitleInput";
import { MessageTypeSelector } from "./MessageTypeSelector";
import { TextContent } from "./content/TextContent";
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
  const { messageType, onTextTypeClick } = useMessageTypeManager();
  const { handleClearVideo } = useContentUpdater();
  
  // Initialize message data when editing an existing message
  useMessageInitializer(message);

  return (
    <div className="space-y-6">
      {/* Title field */}
      <TitleInput />

      {/* Message type selector */}
      <MessageTypeSelector 
        onTextTypeClick={onTextTypeClick}
        onVideoTypeClick={() => {}} // Empty function since video functionality is removed
      />

      {/* Content field based on message type */}
      <div className="space-y-2">
        {messageType === "text" ? (
          <TextContent />
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
        showVideoRecorder={false}
        setShowVideoRecorder={() => {}}
        onVideoContentUpdate={async () => ({})}
        videoUrl={null}
        videoBlob={null}
      />
    </div>
  );
}
