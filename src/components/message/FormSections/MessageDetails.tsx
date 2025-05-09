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
import { useEffect, useState } from "react";

interface MessageDetailsProps {
  message?: any;  // Optional message prop for editing
}

export function MessageDetails({ message }: MessageDetailsProps) {
  const { files, setFiles } = useMessageForm();
  const [showInlineRecording, setShowInlineRecording] = useState(false);
  
  // Use our custom hooks
  const { 
    messageType, onTextTypeClick, onVideoTypeClick,
    videoBlob, videoUrl, showVideoRecorder, setShowVideoRecorder,
    isRecording, startRecording, stopRecording, clearVideo 
  } = useMessageTypeManager();
  
  const { handleVideoContentUpdate, isTranscribingVideo } = useContentUpdater();
  
  // Initialize message data when editing an existing message
  useMessageInitializer(message);

  // Debug log to track state changes
  useEffect(() => {
    console.log("MessageDetails: messageType =", messageType, 
                "showVideoRecorder =", showVideoRecorder,
                "isRecording =", isRecording,
                "videoUrl =", videoUrl ? "present" : "null");
  }, [messageType, showVideoRecorder, isRecording, videoUrl]);

  return (
    <div className="space-y-6">
      {/* Title field */}
      <TitleInput />

      {/* Message type selector */}
      <MessageTypeSelector 
        onTextTypeClick={onTextTypeClick}
        onVideoTypeClick={() => {
          onVideoTypeClick();
          setShowInlineRecording(true);
        }}
      />

      {/* Content field based on message type */}
      <div className="space-y-4">
        {/* Text content is always shown */}
        <TextContent />
        
        {/* Video content section */}
        {messageType === "video" && (
          <div>
            {/* Show existing video if available */}
            {videoUrl && (
              <VideoContent
                videoUrl={videoUrl}
                isRecording={isRecording}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                onClearVideo={clearVideo}
                onTranscribeVideo={async (): Promise<void> => {
                  if (videoBlob) {
                    await handleVideoContentUpdate(videoBlob);
                  }
                }}
              />
            )}
            
            {/* Show record button when no video is available */}
            {!videoUrl && !isRecording && !showInlineRecording && (
              <div className="space-y-2">
                <Label>Video Message</Label>
                <div className="flex flex-col items-center border-2 border-dashed border-muted-foreground/30 rounded-md p-6">
                  <Button
                    type="button"
                    onClick={() => {
                      console.log("Starting inline recording experience...");
                      setShowInlineRecording(true);
                    }}
                    className="flex items-center hover:bg-primary/90 transition-colors"
                  >
                    <Video className="mr-2 h-4 w-4" />
                    Record Video
                  </Button>
                </div>
              </div>
            )}
            
            {/* Show inline recording UI */}
            {!videoUrl && showInlineRecording && (
              <div className="mt-4">
                <VideoContent
                  videoUrl={null}
                  isRecording={isRecording}
                  onStartRecording={startRecording}
                  onStopRecording={stopRecording}
                  onClearVideo={() => {
                    clearVideo();
                    setShowInlineRecording(false);
                  }}
                  onTranscribeVideo={async (): Promise<void> => {
                    if (videoBlob) {
                      await handleVideoContentUpdate(videoBlob);
                    }
                  }}
                />
              </div>
            )}
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

      {/* Media recorder dialogs - keeping this as a backup option */}
      <MediaRecorders 
        showVideoRecorder={showVideoRecorder}
        setShowVideoRecorder={setShowVideoRecorder}
        onVideoContentUpdate={handleVideoContentUpdate}
        videoUrl={videoUrl}
        videoBlob={videoBlob}
        isRecording={isRecording}
        startRecording={startRecording}
        stopRecording={stopRecording}
        clearVideo={clearVideo}
      />
    </div>
  );
}

// Import Button from UI components for Record Video button
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
