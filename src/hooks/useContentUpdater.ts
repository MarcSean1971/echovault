
import { useState } from "react";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { parseMessageTranscription } from "@/services/messages/mediaService";
import { transcribeVideoContent, formatVideoContent } from "@/services/messages/transcriptionService";
import { toast } from "@/components/ui/use-toast";

export function useContentUpdater() {
  const { setContent, setVideoContent, setTextContent } = useMessageForm();
  const [isTranscribingVideo, setIsTranscribingVideo] = useState(false);

  // Extract transcription from content
  const getTranscriptionFromContent = (content: string | null): string | null => {
    if (!content) return null;
    return parseMessageTranscription(content);
  };

  // Check if content contains video data
  const hasVideoData = (content: string | null): boolean => {
    if (!content) return false;
    try {
      const parsed = JSON.parse(content);
      return !!parsed.videoData;
    } catch (e) {
      return false;
    }
  };

  // Handle video content update with optional transcription
  const handleVideoContentUpdate = async (videoBlob: Blob, skipTranscriptionOrBase64: boolean | string = false): Promise<any> => {
    try {
      setIsTranscribingVideo(true);
      
      // Determine if the second parameter is a base64 string or a boolean flag
      const isBase64String = typeof skipTranscriptionOrBase64 === 'string';
      const skipTranscription = isBase64String ? false : skipTranscriptionOrBase64;
      
      let transcription = null;
      
      if (!skipTranscription) {
        // Generate transcription
        transcription = await transcribeVideoContent(videoBlob);
        
        // Show success notification
        toast({
          title: "Video transcribed",
          description: "Video transcription completed successfully"
        });
      }
      
      // Format video content for storage
      const formattedContent = await formatVideoContent(videoBlob, transcription);
      
      // Update the video-specific content
      setVideoContent(formattedContent);
      
      return { success: true, transcription, videoContent: formattedContent };
    } catch (error) {
      console.error("Error updating video content:", error);
      
      toast({
        title: "Transcription Error",
        description: "Failed to transcribe the video",
        variant: "destructive"
      });
      
      return { success: false, error };
    } finally {
      setIsTranscribingVideo(false);
    }
  };

  return {
    handleVideoContentUpdate,
    isTranscribingVideo,
    getTranscriptionFromContent,
    hasVideoData
  };
}
