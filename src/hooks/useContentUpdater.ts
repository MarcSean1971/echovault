
import { useState } from "react";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { parseMessageTranscription } from "@/services/messages/mediaService";
import { formatVideoContent } from "@/services/messages/transcriptionService";

export function useContentUpdater() {
  const { setContent, setVideoContent, setTextContent, content, textContent } = useMessageForm();

  // Extract transcription from content (kept for backward compatibility with existing content)
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

  // Handle video content update (without transcription)
  const handleVideoContentUpdate = async (videoBlob: Blob): Promise<any> => {
    try {
      // Format the video content without transcription
      console.log("Formatting video content without transcription");
      const formattedContent = await formatVideoContent(videoBlob, null);
      
      // Update form state with new content
      setVideoContent(formattedContent);
      setContent(formattedContent);
      
      // Preserve text content
      console.log("Preserving text content:", textContent ? textContent.substring(0, 30) + "..." : "none");
      
      return { success: true };
    } catch (error) {
      console.error("Error updating video content:", error);
      return { success: false, error };
    }
  };
  
  return {
    handleVideoContentUpdate,
    getTranscriptionFromContent,
    hasVideoData
  };
}
