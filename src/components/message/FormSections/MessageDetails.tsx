
import { Label } from "@/components/ui/label";
import { useMessageForm } from "../MessageFormContext";
import { FileUploader } from "@/components/FileUploader";
import { AudioRecorderDialog } from "@/components/media/AudioRecorderDialog";
import { VideoRecorderDialog } from "@/components/media/VideoRecorderDialog";
import { BUTTON_HOVER_EFFECTS, HOVER_TRANSITION } from "@/utils/hoverEffects";
import { useEffect } from "react";

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

interface MessageDetailsProps {
  message?: any;  // Optional message prop for editing
}

export function MessageDetails({ message }: MessageDetailsProps) {
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
    handleAudioReady, clearAudio,
    setAudioUrl, setAudioTranscription
  } = useAudioRecordingHandler();
  
  const {
    showVideoRecorder, setShowVideoRecorder,
    videoBlob, videoUrl,
    isTranscribingVideo, videoTranscription,
    handleVideoReady, clearVideo,
    setVideoUrl, setVideoTranscription
  } = useVideoRecordingHandler();
  
  const {
    messageType, setMessageType,
    handleTextTypeClick, handleAudioTypeClick, handleVideoTypeClick
  } = useMessageTypeHandler();

  // Set initial message type based on the message being edited
  useEffect(() => {
    if (message?.message_type) {
      setMessageType(message.message_type);
      setContextMessageType(message.message_type);
    }
  }, [message, setMessageType, setContextMessageType]);

  // Initialize media content from the message being edited
  useEffect(() => {
    if (!message?.content) return;
    
    if (message.message_type === 'audio' || message.message_type === 'video') {
      try {
        const contentObj = JSON.parse(message.content);
        
        // Initialize audio content
        if (message.message_type === 'audio' && contentObj.audioData) {
          const audioBlob = base64ToBlob(contentObj.audioData, 'audio/webm');
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          setAudioTranscription(contentObj.transcription || null);
        }
        
        // Initialize video content
        if (message.message_type === 'video' && contentObj.videoData) {
          const videoBlob = base64ToBlob(contentObj.videoData, 'video/webm');
          const url = URL.createObjectURL(videoBlob);
          setVideoUrl(url);
          setVideoTranscription(contentObj.transcription || null);
        }
      } catch (e) {
        console.log("Error parsing message content:", e);
      }
    }
  }, [message, setAudioUrl, setAudioTranscription, setVideoUrl, setVideoTranscription]);

  // Helper function to convert base64 to blob
  const base64ToBlob = (base64: string, type: string): Blob => {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type });
  };
  
  // Wrapper functions for message type handling - UPDATED ORDER
  const onTextTypeClick = () => {
    // First restore the content (this function from useMessageTypeHandler fetches the saved text content)
    handleTextTypeClick();
    
    // Wait a brief moment to ensure content is restored before changing the message type
    // This small delay helps prevent the JSON flash
    setTimeout(() => {
      handleMessageTypeChange("text");
    }, 10);
  };
  
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
  
  // Handle type selection with our custom hooks - UPDATED ORDER FOR MEDIA TYPES
  const onAudioTypeClick = () => {
    // First set the media content
    handleAudioTypeClick(setShowAudioRecorder, audioBlob);
    
    // Then update the message type
    handleMessageTypeChange("audio");
  };
  
  const onVideoTypeClick = () => {
    // First set the media content
    handleVideoTypeClick(setShowVideoRecorder, videoBlob);
    
    // Then update the message type
    handleMessageTypeChange("video");
  };

  return (
    <div className="space-y-6">
      {/* Title field */}
      <TitleInput />

      {/* Message type selector */}
      <MessageTypeSelector 
        onTextTypeClick={onTextTypeClick}
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
