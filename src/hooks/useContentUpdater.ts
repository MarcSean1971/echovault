
import { useState } from 'react';
import { useMessageForm } from '@/components/message/MessageFormContext';
import { useVideoRecordingHandler } from './useVideoRecordingHandler';
import { transcribeVideo } from '@/services/messages/transcriptionService';
import { toast } from '@/components/ui/use-toast';

export function useContentUpdater() {
  const { setContent } = useMessageForm();
  const [isTranscribingVideo, setIsTranscribingVideo] = useState(false);
  
  const { 
    clearVideo, 
    setVideoTranscription, 
    setVideoUrl, 
    setVideoBase64, 
    setVideoBlob 
  } = useVideoRecordingHandler();

  // Handle updating video content
  const handleVideoContentUpdate = async (videoBlob: Blob, videoBase64: string) => {
    console.log("Handling video content update, blob size:", videoBlob.size);
    setIsTranscribingVideo(true);
    
    try {
      // Create URL for immediate playback and set all related state
      const videoUrl = URL.createObjectURL(videoBlob);
      setVideoUrl(videoUrl);
      setVideoBlob(videoBlob);
      setVideoBase64(videoBase64);
      console.log("Created video URL for playback:", videoUrl);
      
      // Start transcribing the video
      const transcription = await transcribeVideo(videoBase64);
      console.log("Video transcription completed:", transcription);
      setVideoTranscription(transcription);
      
      // Create video content object with transcription
      const contentObj = {
        videoData: videoBase64,
        transcription
      };
      
      // Update form content
      setContent(JSON.stringify(contentObj));
      
      toast({
        title: "Video transcription complete",
        description: "Your video has been successfully transcribed.",
      });
      
      return contentObj;
    } catch (error) {
      console.error("Error transcribing video:", error);
      toast({
        title: "Transcription failed",
        description: "Could not transcribe video. Video will be saved without transcription.",
        variant: "destructive"
      });
      
      // Still save video data without transcription
      const contentObj = {
        videoData: videoBase64,
        transcription: null
      };
      setContent(JSON.stringify(contentObj));
      return contentObj;
    } finally {
      setIsTranscribingVideo(false);
    }
  };
  
  // Clear video content
  const handleClearVideo = () => {
    clearVideo();
    setContent("");
  };
  
  return {
    handleVideoContentUpdate,
    handleClearVideo,
    isTranscribingVideo
  };
}
