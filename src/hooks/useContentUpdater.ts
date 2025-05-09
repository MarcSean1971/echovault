
import { useState } from "react";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { toast } from "@/components/ui/use-toast";

export function useContentUpdater() {
  const { setContent, setVideoContent, setTextContent, content, textContent } = useMessageForm();
  const [isTranscribingVideo, setIsTranscribingVideo] = useState(false);

  // Convert blob to base64 string
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Format video content for storage
  const formatVideoContent = async (videoBlob: Blob): Promise<string> => {
    try {
      const base64Video = await blobToBase64(videoBlob);
      
      // Create a JSON object with the video data
      const videoContent = {
        videoData: base64Video,
        timestamp: new Date().toISOString()
      };
      
      // Log the content structure that will be stored
      console.log("Formatting video content");
      console.log("Video content structure:", Object.keys(videoContent).join(", "));
      
      return JSON.stringify(videoContent);
    } catch (error) {
      console.error("Error formatting video content:", error);
      toast({
        title: "Error",
        description: "Failed to process video content",
        variant: "destructive"
      });
      throw error;
    }
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
  const handleVideoContentUpdate = async (videoBlob: Blob): Promise<any> => {
    try {
      // Format video content for storage
      const formattedContent = await formatVideoContent(videoBlob);
      
      // Log the formatted content structure
      console.log("Video content formatted");
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
        videoContent: formattedContent 
      };
    } catch (error: any) {
      console.error("Error updating video content:", error);
      
      toast({
        title: "Error",
        description: "Failed to process video content",
        variant: "destructive"
      });
      
      return { success: false, error };
    }
  };

  return {
    handleVideoContentUpdate,
    isTranscribingVideo,
    hasVideoData
  };
}
