
import { Label } from "@/components/ui/label";
import { useMessageForm } from "../MessageFormContext";
import { FileUploader } from "@/components/FileUploader";

// Import our components
import { TitleInput } from "./TitleInput";
import { LocationSection } from "./LocationSection";
import { MediaRecorders } from "./MessageDetailsComponents/MediaRecorders";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import custom hooks
import { useMessageInitializer } from "@/hooks/useMessageInitializer";
import { useContentUpdater } from "@/hooks/useContentUpdater";
import { useMessageTypeManager } from "@/hooks/useMessageTypeManager";
import { useEffect, useState } from "react";
import { TextContent } from "./content/TextContent";
import { VideoContent } from "./content/VideoContent";

interface MessageDetailsProps {
  message?: any;  // Optional message prop for editing
}

export function MessageDetails({ message }: MessageDetailsProps) {
  const { files, setFiles, content, messageType } = useMessageForm();
  const [showInlineRecording, setShowInlineRecording] = useState(false);
  
  // Use our custom hooks
  const { 
    onTextTypeClick, onVideoTypeClick,
    videoBlob, videoUrl, showVideoRecorder, setShowVideoRecorder,
    isRecording, isInitializing, hasPermission, previewStream,
    initializeStream, startRecording, stopRecording, clearVideo,
    forceInitializeCamera, handleInitializedVideo, initializedFromMessage
  } = useMessageTypeManager();
  
  const { handleVideoContentUpdate } = useContentUpdater();

  // Initialize message data when editing an existing message
  const { videoUrl: initialVideoUrl, videoBlob: initialVideoBlob, videoTranscription, hasInitialized } = useMessageInitializer(message);

  // Connect initialized video data to our message type manager
  useEffect(() => {
    if (hasInitialized && initialVideoBlob && initialVideoUrl && !initializedFromMessage) {
      console.log("MessageDetails: Connecting initialized video to message type manager");
      console.log("Initial video blob size:", initialVideoBlob.size);
      
      handleInitializedVideo(initialVideoBlob, initialVideoUrl, null);
    }
  }, [hasInitialized, initialVideoBlob, initialVideoUrl, handleInitializedVideo, initializedFromMessage]);

  // Initialize the camera when switching to video mode
  useEffect(() => {
    console.log("MessageDetails: messageType changed to", messageType);
    
    if (messageType === "video" && !videoUrl && !previewStream && !showInlineRecording) {
      console.log("Video mode detected. Setting showInlineRecording to true");
      setShowInlineRecording(true);
    }
  }, [messageType, videoUrl, previewStream, showInlineRecording]);

  // Initialize camera preview when showing inline recording UI
  useEffect(() => {
    console.log("MessageDetails: showInlineRecording:", showInlineRecording, 
                "messageType:", messageType, 
                "videoUrl:", videoUrl ? "present" : "none",
                "previewStream:", previewStream ? "present" : "none");
    
    if (showInlineRecording && messageType === "video" && !videoUrl && !previewStream) {
      console.log("Initializing camera preview for inline recording");
      // Use forceInitializeCamera to ensure we get a fresh stream
      forceInitializeCamera().catch(error => {
        console.error("Failed to initialize camera stream:", error);
      });
    }
  }, [showInlineRecording, messageType, videoUrl, previewStream, forceInitializeCamera]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    console.log("Tab changed to:", value);
    if (value === "text") {
      onTextTypeClick();
    } else if (value === "video") {
      onVideoTypeClick();
    }
  };

  // Generate a key for the VideoContent to force remount when needed
  const getVideoContentKey = () => {
    return `video-content-${messageType === 'video' ? 'active' : 'inactive'}-${videoUrl ? 'has-video' : 'no-video'}-${Date.now()}`;
  };

  return (
    <div className="space-y-6">
      {/* Title field */}
      <TitleInput />

      {/* Message type selector as tabs */}
      <div>
        <Label className="mb-2 block">Message Type</Label>
        <Tabs 
          defaultValue="text" 
          value={messageType} 
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger 
              value="text" 
              className="flex items-center justify-center transition-all hover:bg-primary/10"
            >
              <span className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-text">
                  <path d="M17 6.1H3"/>
                  <path d="M21 12.1H3"/>
                  <path d="M15.1 18H3"/>
                </svg>
                Text
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="video" 
              className="flex items-center justify-center transition-all hover:bg-primary/10"
            >
              <span className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-video">
                  <path d="m22 8-6 4 6 4V8Z"/>
                  <rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>
                </svg>
                Video
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Text content tab */}
          <TabsContent value="text" className="mt-0">
            <TextContent />
          </TabsContent>

          {/* Video content tab */}
          <TabsContent value="video" className="mt-0">
            <VideoContent
              key={getVideoContentKey()}
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
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* File attachments section */}
      <div className="space-y-2">
        <Label>File Attachments</Label>
        <FileUploader 
          files={files} 
          onChange={setFiles} 
        />
      </div>

      {/* Location section */}
      <LocationSection />

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
