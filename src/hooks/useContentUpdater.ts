
import { useState } from "react";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { parseMessageTranscription } from "@/services/messages/mediaService";
import { transcribeVideoContent, formatVideoContent } from "@/services/messages/transcriptionService";
import { toast } from "@/components/ui/use-toast";

export function useContentUpdater() {
  const { setContent, setVideoContent, setTextContent, content } = useMessageForm();
  const [isTranscribingVideo, setIsTranscribingVideo] = useState(false);

  // Extract transcription from content
  const getTranscriptionFromContent = (content: string | null): string | null => {
    if (!content) return null;
    
    try {
      const parsed = JSON.parse(content);
      if (parsed && parsed.transcription) {
        return parsed.transcription;
      }
    } catch (e) {
      // Not JSON, try using the mediaService parser as fallback
      return parseMessageTranscription(content);
    }
    
    return null;
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
        // Generate transcription using OpenAI via edge function
        try {
          transcription = await transcribeVideoContent(videoBlob);
          console.log("Transcription generated:", transcription ? transcription.substring(0, 50) + "..." : "none");
          
          // Show success notification
          toast({
            title: "Video transcribed",
            description: "Video transcription completed successfully"
          });
        } catch (error) {
          console.error("Transcription error:", error);
          // We'll continue even if transcription fails
          toast({
            title: "Transcription Warning",
            description: "Transcription failed, but your video will still be saved",
            variant: "default"
          });
        }
      } else {
        console.log("Skipping transcription as requested");
      }
      
      // Format video content for storage
      const formattedContent = await formatVideoContent(videoBlob, transcription);
      
      // Update the video-specific content
      setVideoContent(formattedContent);
      
      // If there's text content, make sure to preserve it in the video content
      const { textContent } = useMessageForm();
      if (textContent && textContent.trim() !== '') {
        try {
          // Parse the video content to add text content to it
          const videoContentObj = JSON.parse(formattedContent);
          videoContentObj.additionalText = textContent;
          const combinedContent = JSON.stringify(videoContentObj);
          setVideoContent(combinedContent);
          setContent(combinedContent);
        } catch (error) {
          console.error("Error combining text and video content:", error);
          setContent(formattedContent);
        }
      } else {
        setContent(formattedContent);
      }
      
      return { success: true, transcription, videoContent: formattedContent };
    } catch (error) {
      console.error("Error updating video content:", error);
      
      toast({
        title: "Error",
        description: "Failed to process video content",
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
