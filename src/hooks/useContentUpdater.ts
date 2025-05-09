
import { useState } from 'react';
import { useMessageForm } from '@/components/message/MessageFormContext';
import { toast } from '@/components/ui/use-toast';
import { transcribeVideoContent, formatVideoContent } from '@/services/messages/transcriptionService';

export function useContentUpdater() {
  const { setContent } = useMessageForm();
  const [isTranscribingVideo, setIsTranscribingVideo] = useState(false);
  
  // Handle updating video content with transcription
  const handleVideoContentUpdate = async (videoBlob: Blob) => {
    if (!videoBlob) {
      toast({
        title: "No video",
        description: "There is no video to transcribe",
        variant: "destructive"
      });
      return {};
    }

    setIsTranscribingVideo(true);
    
    try {
      // Get transcription
      const transcription = await transcribeVideoContent(videoBlob);
      
      // Format content for storage
      const videoContent = await formatVideoContent(videoBlob, transcription);
      
      // Update form content
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
    setContent("");
  };
  
  return {
    handleVideoContentUpdate,
    handleClearVideo,
    isTranscribingVideo
  };
}
