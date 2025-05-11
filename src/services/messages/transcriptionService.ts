
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
    
    // Log the content structure that will be stored
    console.log("Formatting video content:", Object.keys(videoContent).join(", "));
    
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
