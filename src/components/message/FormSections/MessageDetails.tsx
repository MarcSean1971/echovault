
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
    isRecording, isInitializing, hasPermission, previewStream,
    initializeStream, startRecording, stopRecording, clearVideo 
  } = useMessageTypeManager();
  
  const { handleVideoContentUpdate, isTranscribingVideo } = useContentUpdater();

  // Initialize message data when editing an existing message
  useMessageInitializer(message);

  // Initialize the camera when switching to video mode
  useEffect(() => {
    if (messageType === "video" && !videoUrl && !previewStream && !showInlineRecording) {
      console.log("Video mode detected. Setting showInlineRecording to true");
      setShowInlineRecording(true);
    }
  }, [messageType, videoUrl, previewStream, showInlineRecording]);

  // Debug log to track state changes
  useEffect(() => {
    console.log("MessageDetails: messageType =", messageType, 
                "showVideoRecorder =", showVideoRecorder,
                "isRecording =", isRecording,
                "videoUrl =", videoUrl ? "present" : "null",
                "previewStream =", previewStream ? "active" : "null");
  }, [messageType, showVideoRecorder, isRecording, videoUrl, previewStream]);

  // Initialize camera preview when showing inline recording UI
  useEffect(() => {
    if (showInlineRecording && messageType === "video" && !videoUrl && !previewStream) {
      console.log("Initializing camera preview for inline recording");
      initializeStream().catch(error => {
        console.error("Failed to initialize camera stream:", error);
      });
    }
  }, [showInlineRecording, messageType, videoUrl, previewStream, initializeStream]);

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
        
        {/* Video content section */}
        {messageType === "video" && (
          <div>
            {/* Show the video content component */}
            <VideoContent
              videoUrl={videoUrl}
              isRecording={isRecording}
              isInitializing={isInitializing}
              hasPermission={hasPermission}
              previewStream={previewStream}
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
        isInitializing={isInitializing}
        hasPermission={hasPermission}
        previewStream={previewStream}
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
