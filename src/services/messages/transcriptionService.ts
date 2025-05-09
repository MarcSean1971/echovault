
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
 * Transcribe video content using OpenAI via edge function
 */
export const transcribeVideoContent = async (videoBlob: Blob): Promise<string> => {
  try {
    // Show a toast to indicate transcription has started
    const loadingToast = toast({
      title: "Processing video",
      description: "Transcribing your video, this may take a moment...",
    });
    
    // Convert video blob to base64
    const base64Video = await blobToBase64(videoBlob);
    console.log("Video converted to base64, size:", base64Video.length);
    
    // Call the edge function
    const { data, error } = await supabase.functions.invoke("transcribe-video", {
      body: { videoBase64: base64Video },
    });
    
    // Dismiss the loading toast
    loadingToast.dismiss?.();
    
    if (error) {
      console.error("Edge function error:", error);
      throw new Error(`Transcription error: ${error.message}`);
    }
    
    if (!data.success) {
      console.error("Transcription failed:", data.error);
      throw new Error(`Transcription failed: ${data.error}`);
    }
    
    console.log("Transcription successful:", data.transcription);
    return data.transcription;
  } catch (error) {
    console.error("Error transcribing video:", error);
    toast({
      title: "Transcription failed",
      description: error.message || "Failed to transcribe video content",
      variant: "destructive"
    });
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
