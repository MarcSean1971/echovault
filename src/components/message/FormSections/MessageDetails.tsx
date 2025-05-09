import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { useMessageForm } from "../MessageFormContext";
import { FileUploader } from "@/components/FileUploader";

// Import our components
import { TitleInput } from "./TitleInput";
import { LocationSection } from "./LocationSection";
import { MediaRecorders } from "./MessageDetailsComponents/MediaRecorders";
import { MessageTypeTabSelector } from "./MessageTypeTabSelector";

// Import custom hooks
import { useMessageInitializer } from "@/hooks/useMessageInitializer";
import { useContentUpdater } from "@/hooks/useContentUpdater";
import { useMessageVideoHandler } from "@/hooks/useMessageVideoHandler";

interface MessageDetailsProps {
  message?: any;  // Optional message prop for editing
}

export function MessageDetails({ message }: MessageDetailsProps) {
  const { files, setFiles, content, messageType } = useMessageForm();
  const [showInlineRecording, setShowInlineRecording] = useState(false);
  const [audioTranscription, setAudioTranscription] = useState<string | null>(null);
  
  // Use our custom hook for handling media
  const {
    // Text handling
    onTextTypeClick,
    
    // Video handling
    onVideoTypeClick,
    videoUrl, videoBlob, showVideoRecorder, setShowVideoRecorder,
    isVideoRecording, isVideoInitializing, hasVideoPermission, videoPreviewStream,
    startVideoRecording, stopVideoRecording, clearVideo, forceInitializeCamera, 
    
    // Audio handling
    onAudioTypeClick,
    audioUrl, audioBlob, audioDuration, 
    isAudioRecording, isAudioInitializing, hasAudioPermission,
    startAudioRecording, stopAudioRecording, clearAudio, forceInitializeMicrophone,
    transcribeAudio,
    
    handleVideoContentUpdate,
    handleAudioContentUpdate
  } = useMessageVideoHandler(message);

  // Initialize the camera or microphone when switching to media mode
  useEffect(() => {
    console.log("MessageDetails: messageType changed to", messageType);
    
    if (messageType === "video" && !videoUrl && !videoPreviewStream && !showInlineRecording) {
      console.log("Video mode detected. Setting showInlineRecording to true");
      setShowInlineRecording(true);
    }
    
    if (messageType === "audio" && !audioUrl && !showInlineRecording) {
      console.log("Audio mode detected. Setting showInlineRecording to true");
      setShowInlineRecording(true);
    }
  }, [messageType, videoUrl, videoPreviewStream, audioUrl, showInlineRecording]);

  // Initialize camera preview when showing inline recording UI
  useEffect(() => {
    if (showInlineRecording && messageType === "video" && !videoUrl && !videoPreviewStream) {
      console.log("Initializing camera preview for inline recording");
      // Use forceInitializeCamera to ensure we get a fresh stream
      forceInitializeCamera().catch(error => {
        console.error("Failed to initialize camera stream:", error);
      });
    }
    
    if (showInlineRecording && messageType === "audio" && !audioUrl) {
      console.log("Initializing microphone for inline recording");
      // Use forceInitializeMicrophone to ensure we get a fresh stream
      forceInitializeMicrophone().catch(error => {
        console.error("Failed to initialize microphone stream:", error);
      });
    }
  }, [showInlineRecording, messageType, videoUrl, videoPreviewStream, audioUrl, forceInitializeCamera, forceInitializeMicrophone]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    console.log("Tab changed to:", value);
    if (value === "text") {
      onTextTypeClick();
    } else if (value === "video") {
      onVideoTypeClick();
    } else if (value === "audio") {
      onAudioTypeClick();
    }
  };

  // Generate keys for content components to force remount when needed
  const getVideoContentKey = () => {
    return `video-content-${messageType === 'video' ? 'active' : 'inactive'}-${videoUrl ? 'has-video' : 'no-video'}-${Date.now()}`;
  };
  
  const getAudioContentKey = () => {
    return `audio-content-${messageType === 'audio' ? 'active' : 'inactive'}-${audioUrl ? 'has-audio' : 'no-audio'}-${Date.now()}`;
  };
  
  // Handle audio transcription
  const handleTranscribeAudio = async () => {
    if (!audioBlob) return;
    
    try {
      const transcription = await transcribeAudio();
      setAudioTranscription(transcription);
      
      // Update the audio content with transcription
      if (audioBlob) {
        await handleAudioContentUpdate(audioBlob, transcription);
      }
    } catch (error) {
      console.error("Error transcribing audio:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title field */}
      <TitleInput />

      {/* Message type selector as tabs */}
      <div>
        <Label className="mb-2 block">Message Type</Label>
        <MessageTypeTabSelector
          messageType={messageType}
          onTabChange={handleTabChange}
          
          // Video props
          videoUrl={videoUrl}
          isVideoRecording={isVideoRecording}
          isVideoInitializing={isVideoInitializing}
          hasVideoPermission={hasVideoPermission}
          videoPreviewStream={videoPreviewStream}
          onStartVideoRecording={startVideoRecording}
          onStopVideoRecording={stopVideoRecording}
          onClearVideo={() => {
            clearVideo();
            setShowInlineRecording(false);
          }}
          
          // Audio props
          audioUrl={audioUrl}
          audioDuration={audioDuration}
          isAudioRecording={isAudioRecording}
          isAudioInitializing={isAudioInitializing}
          hasAudioPermission={hasAudioPermission}
          audioTranscription={audioTranscription}
          onStartAudioRecording={startAudioRecording}
          onStopAudioRecording={stopAudioRecording}
          onClearAudio={() => {
            clearAudio();
            setAudioTranscription(null);
            setShowInlineRecording(false);
          }}
          onTranscribeAudio={handleTranscribeAudio}
          
          // Keys for component remounting
          getVideoContentKey={getVideoContentKey}
          getAudioContentKey={getAudioContentKey}
        />
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
        isRecording={isVideoRecording}
        isInitializing={isVideoInitializing}
        hasPermission={hasVideoPermission}
        previewStream={videoPreviewStream}
        startRecording={startVideoRecording}
        stopRecording={stopVideoRecording}
        clearVideo={clearVideo}
      />
    </div>
  );
}

// Import Button from UI components for Record Video button
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
