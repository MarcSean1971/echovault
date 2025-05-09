
import { useState } from 'react';
import { useMessageForm } from '@/components/message/MessageFormContext';
import { toast } from '@/components/ui/use-toast';
import { transcribeVideoContent, formatVideoContent, blobToBase64 } from '@/services/messages/transcriptionService';

export function useContentUpdater() {
  const { setContent } = useMessageForm();
  const [isTranscribingVideo, setIsTranscribingVideo] = useState(false);
  
  // Handle updating video content with transcription
  const handleVideoContentUpdate = async (videoBlob: Blob, videoBase64?: string) => {
    if (!videoBlob) {
      toast({
        title: "No video",
        description: "There is no video to transcribe",
        variant: "destructive"
      });
      return {};
    }

    setIsTranscribingVideo(true);
    console.log("Processing video content for update...");
    
    try {
      let base64Data = videoBase64;
      
      // Convert blob to base64 if not provided
      if (!base64Data) {
        console.log("Converting video blob to base64...");
        base64Data = await blobToBase64(videoBlob);
      }
      
      // Get transcription
      console.log("Getting transcription for video...");
      const transcription = await transcribeVideoContent(videoBlob);
      
      // Format content for storage
      console.log("Formatting video content for storage...");
      const videoContent = await formatVideoContent(videoBlob, transcription);
      
      // Update form content
      console.log("Updating form content with video data...");
      setContent(videoContent);
      
      toast({
        title: "Video transcribed",
        description: "Your video has been successfully transcribed"
      });
      
      return { transcription };
    } catch (error) {
      console.error("Error updating video content:", error);
      toast({
        title: "Transcription failed",
        description: "Failed to transcribe the video",
        variant: "destructive"
      });
      return {};
    } finally {
      setIsTranscribingVideo(false);
    }
  };
  
  // Clear video content
  const handleClearVideo = () => {
    console.log("Clearing video content...");
    setContent("");
  };
  
  return {
    handleVideoContentUpdate,
    handleClearVideo,
    isTranscribingVideo
  };
}
