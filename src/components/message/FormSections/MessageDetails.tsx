
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { useMessageForm } from "../MessageFormContext";
import { FileUploader } from "@/components/FileUploader";
import { AudioRecorderDialog } from "@/components/media/AudioRecorderDialog";
import { VideoRecorderDialog } from "@/components/media/VideoRecorderDialog";
import { transcribeVideo, transcribeAudio } from "@/services/messages/transcriptionService";
import { toast } from "@/components/ui/use-toast";

// Import our new components
import { TitleInput } from "./TitleInput";
import { MessageTypeSelector } from "./MessageTypeSelector";
import { TextContent } from "./content/TextContent";
import { AudioContent } from "./content/AudioContent";
import { VideoContent } from "./content/VideoContent";
import { LocationSection } from "./LocationSection";

export function MessageDetails() {
  const { 
    content, setContent, 
    messageType, setMessageType,
    files, setFiles
  } = useMessageForm();
  
  // Audio recording states
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isTranscribingAudio, setIsTranscribingAudio] = useState(false);
  const [audioTranscription, setAudioTranscription] = useState<string | null>(null);

  // Video recording states
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoBase64, setVideoBase64] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isTranscribingVideo, setIsTranscribingVideo] = useState(false);
  const [videoTranscription, setVideoTranscription] = useState<string | null>(null);

  // Function to handle the audio type button click
  const handleAudioTypeClick = () => {
    setMessageType("audio");
    if (!audioBlob) {
      setShowAudioRecorder(true);
    }
  };

  // Function to handle the video type button click
  const handleVideoTypeClick = () => {
    setMessageType("video");
    if (!videoBlob) {
      setShowVideoRecorder(true);
    }
  };

  // Function to handle audio recording completion
  const handleAudioReady = async (audioBlob: Blob, audioBase64: string) => {
    setAudioBlob(audioBlob);
    setAudioBase64(audioBase64);
    setAudioUrl(URL.createObjectURL(audioBlob));
    
    // Start transcribing the audio
    setIsTranscribingAudio(true);
    try {
      const transcription = await transcribeAudio(audioBase64, 'audio/webm');
      setAudioTranscription(transcription);
      
      // Store both audio data and transcription in content as JSON
      const contentData = {
        audioData: audioBase64,
        transcription: transcription
      };
      setContent(JSON.stringify(contentData));
      
      toast({
        title: "Audio transcription complete",
        description: "Your audio has been successfully transcribed.",
      });
    } catch (error) {
      console.error("Error transcribing audio:", error);
      toast({
        title: "Transcription failed",
        description: "Could not transcribe audio. Audio will be saved without transcription.",
        variant: "destructive",
      });
      
      // Still save the audio data in content even if transcription fails
      const contentData = {
        audioData: audioBase64,
        transcription: null
      };
      setContent(JSON.stringify(contentData));
    } finally {
      setIsTranscribingAudio(false);
    }
  };

  // Function to handle video recording completion
  const handleVideoReady = async (videoBlob: Blob, videoBase64: string) => {
    setVideoBlob(videoBlob);
    setVideoBase64(videoBase64);
    setVideoUrl(URL.createObjectURL(videoBlob));
    
    // Start transcribing the video
    setIsTranscribingVideo(true);
    try {
      const transcription = await transcribeVideo(videoBase64, 'video/webm');
      setVideoTranscription(transcription);
      
      // Store both video data and transcription in content as JSON
      const contentData = {
        videoData: videoBase64,
        transcription: transcription
      };
      setContent(JSON.stringify(contentData));
      
      toast({
        title: "Video transcription complete",
        description: "Your video has been successfully transcribed.",
      });
    } catch (error) {
      console.error("Error transcribing video:", error);
      toast({
        title: "Transcription failed",
        description: "Could not transcribe video. Video will be saved without transcription.",
        variant: "destructive",
      });
      
      // Still save the video data in content even if transcription fails
      const contentData = {
        videoData: videoBase64,
        transcription: null
      };
      setContent(JSON.stringify(contentData));
    } finally {
      setIsTranscribingVideo(false);
    }
  };

  // Function to clear recorded audio
  const clearAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioBase64(null);
    setAudioUrl(null);
    setAudioTranscription(null);
    setContent("");
  };

  // Function to clear recorded video
  const clearVideo = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoBlob(null);
    setVideoBase64(null);
    setVideoUrl(null);
    setVideoTranscription(null);
    setContent("");
  };

  return (
    <div className="space-y-6">
      {/* Title field */}
      <TitleInput />

      {/* Message type selector */}
      <MessageTypeSelector 
        onAudioTypeClick={handleAudioTypeClick}
        onVideoTypeClick={handleVideoTypeClick}
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
            onClearAudio={clearAudio}
          />
        ) : messageType === "video" ? (
          <VideoContent 
            videoUrl={videoUrl}
            videoTranscription={videoTranscription}
            isTranscribingVideo={isTranscribingVideo}
            onRecordClick={() => setShowVideoRecorder(true)}
            onClearVideo={clearVideo}
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
        onAudioReady={handleAudioReady}
      />
      
      {/* Video Recorder Dialog */}
      <VideoRecorderDialog 
        open={showVideoRecorder} 
        onOpenChange={setShowVideoRecorder} 
        onVideoReady={handleVideoReady}
      />
    </div>
  );
}
