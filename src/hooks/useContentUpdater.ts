
import { useState } from "react";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { formatVideoContent, transcribeVideoContent } from "@/services/messages/transcriptionService";
import { toast } from "@/components/ui/use-toast";

export function useContentUpdater() {
  const { setContent } = useMessageForm();
  const [isTranscribingVideo, setIsTranscribingVideo] = useState(false);

  // Process video content - transcribe and update the form content
  const handleVideoContentUpdate = async (blob: Blob) => {
    try {
      setIsTranscribingVideo(true);
      
      // Transcribe the video
      console.log("Transcribing video...");
      const transcription = await transcribeVideoContent(blob);
      console.log("Video transcription complete:", transcription);
      
      // Format the content with the video data and transcription
      const formattedContent = await formatVideoContent(blob, transcription);
      
      // Update the form content
      setContent(formattedContent);
      
      return transcription;
    } catch (error) {
      console.error("Error updating video content:", error);
      toast({
        title: "Error",
        description: "Failed to process video content",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsTranscribingVideo(false);
    }
  };

  return {
    handleVideoContentUpdate,
    isTranscribingVideo
  };
}
