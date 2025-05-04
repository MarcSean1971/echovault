
import { useState } from "react";
import { transcribeVideo } from "@/services/messages/transcriptionService";
import { toast } from "@/components/ui/use-toast";

export function useVideoRecordingHandler() {
  // Video recording states
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoBase64, setVideoBase64] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isTranscribingVideo, setIsTranscribingVideo] = useState(false);
  const [videoTranscription, setVideoTranscription] = useState<string | null>(null);
  
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
      
      toast({
        title: "Video transcription complete",
        description: "Your video has been successfully transcribed.",
      });
      
      return contentData;
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
      
      return contentData;
    } finally {
      setIsTranscribingVideo(false);
    }
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
    return "";
  };

  return {
    showVideoRecorder,
    setShowVideoRecorder,
    videoBlob,
    videoBase64,
    videoUrl,
    isTranscribingVideo,
    videoTranscription,
    handleVideoReady,
    clearVideo
  };
}
