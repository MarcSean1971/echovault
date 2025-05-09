
import { useState } from "react";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { formatVideoContent, transcribeVideoContent } from "@/services/messages/transcriptionService";
import { toast } from "@/components/ui/use-toast";
import { parseMessageTranscription } from "@/services/messages/mediaService";

export function useContentUpdater() {
  const { setContent, messageType } = useMessageForm();
  const [isTranscribingVideo, setIsTranscribingVideo] = useState(false);
  const [videoTranscriptionText, setVideoTranscriptionText] = useState<string | null>(null);

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
      
      // Update the form content (this stores the complete JSON with video data)
      setContent(formattedContent);
      
      // Store the transcription text separately for display
      setVideoTranscriptionText(transcription);
      
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

  // Extract transcription from content JSON
  const getTranscriptionFromContent = (contentJson: string | null): string | null => {
    if (!contentJson) return null;
    return parseMessageTranscription(contentJson);
  };

  return {
    handleVideoContentUpdate,
    isTranscribingVideo,
    videoTranscriptionText,
    setVideoTranscriptionText,
    getTranscriptionFromContent
  };
}
