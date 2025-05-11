
import { useState } from "react";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { parseMessageTranscription } from "@/services/messages/mediaService";
import { transcribeVideoContent, formatVideoContent } from "@/services/messages/transcriptionService";
import { toast } from "@/components/ui/use-toast";

export function useContentUpdater() {
  const { setContent, setVideoContent, setTextContent, content, textContent } = useMessageForm();
  const [isTranscribingVideo, setIsTranscribingVideo] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);

  // Extract transcription from content
  const getTranscriptionFromContent = (content: string | null): string | null => {
    if (!content) return null;
    
    try {
      // First attempt to parse as JSON
      const parsed = JSON.parse(content);
      
      // Check direct transcription field
      if (parsed && parsed.transcription) {
        console.log("Found direct transcription in content:", 
                    parsed.transcription.substring(0, 30) + "...");
        return parsed.transcription;
      }
      
      // Check for nested video content structure
      if (parsed && parsed.videoContent) {
        try {
          const videoContentObj = typeof parsed.videoContent === 'string' ? 
                                 JSON.parse(parsed.videoContent) : 
                                 parsed.videoContent;
          
          if (videoContentObj && videoContentObj.transcription) {
            console.log("Found transcription in nested videoContent:", 
                        videoContentObj.transcription.substring(0, 30) + "...");
            return videoContentObj.transcription;
          }
        } catch (e) {
          console.log("Failed to parse nested videoContent:", e);
        }
      }
    } catch (e) {
      console.log("Content is not valid JSON, using mediaService parser as fallback");
      // Not JSON, try using the mediaService parser as fallback
      return parseMessageTranscription(content);
    }
    
    console.log("No transcription found in content");
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
      setTranscriptionError(null);
      
      // Determine if the second parameter is a base64 string or a boolean flag
      const isBase64String = typeof skipTranscriptionOrBase64 === 'string';
      const skipTranscription = isBase64String ? false : skipTranscriptionOrBase64;
      
      let transcription = null;
      
      if (!skipTranscription) {
        // Generate transcription using OpenAI via edge function
        try {
          console.log("Starting transcription process for video blob size:", videoBlob.size);
          console.log("Video blob type:", videoBlob.type);
          transcription = await transcribeVideoContent(videoBlob);
          console.log("Transcription generated:", transcription ? transcription.substring(0, 50) + "..." : "none");
          
          // Show success notification
          toast({
            title: "Video transcribed",
            description: "Transcription has been generated successfully"
          });
        } catch (error: any) {
          console.error("Error generating transcription:", error);
          setTranscriptionError(error.message || "Failed to transcribe video");
          
          // Show error notification
          toast({
            title: "Transcription failed",
            description: error.message || "An error occurred during transcription",
            variant: "destructive"
          });
        }
      }
      
      // Format the video content with transcription
      console.log("Formatting video content with transcription", !!transcription);
      const formattedContent = await formatVideoContent(videoBlob, transcription);
      
      // Update form state with new content
      setVideoContent(formattedContent);
      setContent(formattedContent);
      
      // Preserve text content
      console.log("Preserving text content:", textContent ? textContent.substring(0, 30) + "..." : "none");
      
      return { success: true, transcription };
    } catch (error) {
      console.error("Error updating video content:", error);
      return { success: false, error };
    } finally {
      setIsTranscribingVideo(false);
    }
  };
  
  return {
    handleVideoContentUpdate,
    getTranscriptionFromContent,
    hasVideoData,
    isTranscribingVideo,
    transcriptionError
  };
}
