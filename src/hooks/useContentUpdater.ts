
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
            description: "Video transcription completed successfully"
          });
        } catch (error: any) {
          console.error("Transcription error:", error);
          setTranscriptionError(error.message || "Failed to transcribe video");
          
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
      
      // Log the formatted content structure
      console.log("Video content formatted with transcription:", !!transcription);
      console.log("Formatted content sample:", formattedContent.substring(0, 100) + "...");
      
      // Update the video-specific content
      setVideoContent(formattedContent);
      
      // Get current text content to preserve it
      const currentTextContent = textContent;
      
      if (currentTextContent && currentTextContent.trim() !== '') {
        try {
          // Parse the video content to add text content to it
          const videoContentObj = JSON.parse(formattedContent);
          videoContentObj.additionalText = currentTextContent;
          const combinedContent = JSON.stringify(videoContentObj);
          console.log("Combined content created with additional text");
          setVideoContent(combinedContent);
          setContent(combinedContent);
        } catch (error) {
          console.error("Error combining text and video content:", error);
          setContent(formattedContent);
        }
      } else {
        setContent(formattedContent);
      }
      
      return { 
        success: true, 
        transcription, 
        videoContent: formattedContent 
      };
    } catch (error: any) {
      console.error("Error updating video content:", error);
      setTranscriptionError(error.message || "Failed to process video content");
      
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
    transcriptionError,
    getTranscriptionFromContent,
    hasVideoData
  };
}
