
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Convert blob to base64 string
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
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

/**
 * Transcribe video content using the server
 */
export const transcribeVideoContent = async (videoBlob: Blob): Promise<string> => {
  try {
    // Convert video blob to base64
    const base64Video = await blobToBase64(videoBlob);
    
    // For now, we'll return a placeholder transcription
    // In a real implementation, you would send this to a server for processing
    console.log("Video transcription would be processed server-side");
    
    // Simulate server processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Return a placeholder transcription
    return "This is a placeholder transcription. In a real implementation, the video would be processed by a speech-to-text service.";
  } catch (error) {
    console.error("Error transcribing video:", error);
    throw new Error("Failed to transcribe video content");
  }
};

/**
 * Format video content for storage
 */
export const formatVideoContent = async (
  videoBlob: Blob, 
  transcription: string | null = null
): Promise<string> => {
  try {
    const base64Video = await blobToBase64(videoBlob);
    
    // Create a JSON object with the video data and transcription
    const videoContent = {
      videoData: base64Video,
      transcription,
      timestamp: new Date().toISOString()
    };
    
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

/**
 * Parse video content from string
 */
export const parseVideoContent = (content: string | null): {
  videoData: string | null;
  transcription: string | null;
} => {
  if (!content) return { videoData: null, transcription: null };
  
  try {
    const parsedContent = JSON.parse(content);
    
    if (parsedContent.videoData) {
      return {
        videoData: parsedContent.videoData,
        transcription: parsedContent.transcription || null
      };
    }
  } catch (e) {
    // Not JSON or invalid format
    console.log("Content is not video format:", e);
  }
  
  return { videoData: null, transcription: null };
};
