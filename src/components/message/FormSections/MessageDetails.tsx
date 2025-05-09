
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
    audioBlob, audioUrl, audioBase64,
    isTranscribingAudio, audioTranscription,
    handleAudioReady, clearAudio,
    setAudioUrl, setAudioTranscription, setAudioBase64
  } = useAudioRecordingHandler();
  
  const {
    showVideoRecorder, setShowVideoRecorder,
    videoBlob, videoUrl, videoBase64,
    isTranscribingVideo, videoTranscription,
    handleVideoReady, clearVideo,
    setVideoUrl, setVideoTranscription, setVideoBase64
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
          setAudioBase64(contentObj.audioData);
          setAudioTranscription(contentObj.transcription || null);
          
          // Important: Set the form content to match the audio data
          setContent(message.content);
        }
        
        // Initialize video content
        if (message.message_type === 'video' && contentObj.videoData) {
          const videoBlob = base64ToBlob(contentObj.videoData, 'video/webm');
          const url = URL.createObjectURL(videoBlob);
          setVideoUrl(url);
          setVideoBase64(contentObj.videoData);
          setVideoTranscription(contentObj.transcription || null);
          
          // Important: Set the form content to match the video data
          setContent(message.content);
        }
      } catch (e) {
        console.log("Error parsing message content:", e);
      }
    } else if (message.message_type === 'text' && message.content) {
      // For text messages, just set the content directly
      setContent(message.content);
    }
  }, [message, setAudioUrl, setAudioBase64, setAudioTranscription, setVideoUrl, setVideoBase64, setVideoTranscription, setContent]);

  // Helper function to convert base64 to blob
  const base64ToBlob = (base64: string, type: string): Blob => {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type });
  };
  
  // Wrapper functions for message type handling
  const onTextTypeClick = () => {
    handleTextTypeClick();
    handleMessageTypeChange("text");
  };
  
  // Sync our local messageType with the context
  const handleMessageTypeChange = (type: string) => {
    setMessageType(type);
    setContextMessageType(type);
    
    // When changing message type, ensure content is properly formatted
    if (type === "audio" && audioBase64) {
      // Format content as JSON with audioData
      const contentData = {
        audioData: audioBase64,
        transcription: audioTranscription
      };
      setContent(JSON.stringify(contentData));
    } else if (type === "video" && videoBase64) {
      // Format content as JSON with videoData
      const contentData = {
        videoData: videoBase64,
        transcription: videoTranscription
      };
      setContent(JSON.stringify(contentData));
    }
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
    
    if (audioBase64) {
      // If we already have audio data, update the content immediately
      const contentData = {
        audioData: audioBase64,
        transcription: audioTranscription
      };
      setContent(JSON.stringify(contentData));
    }
    
    handleMessageTypeChange("audio");
  };
  
  const onVideoTypeClick = () => {
    handleVideoTypeClick(setShowVideoRecorder, videoBlob);
    
    if (videoBase64) {
      // If we already have video data, update the content immediately
      const contentData = {
        videoData: videoBase64,
        transcription: videoTranscription
      };
      setContent(JSON.stringify(contentData));
    }
    
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
