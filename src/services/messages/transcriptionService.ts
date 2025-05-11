
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
      description: "Extracting audio and transcribing, this may take a moment...",
      duration: 20000, // Show for longer since processing takes time
    });
    
    // Convert video blob to base64
    const base64Video = await blobToBase64(videoBlob);
    console.log("Video converted to base64, size:", base64Video.length);
    console.log("Video blob type:", videoBlob.type);
    
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
    
    if (!data || !data.success) {
      console.error("Transcription failed:", data?.error || "Unknown error");
      throw new Error(`Transcription failed: ${data?.error || "Unknown error"}`);
    }
    
    console.log("Transcription successful:", data.transcription);
    toast({
      title: "Transcription complete",
      description: "Video transcription completed successfully",
      duration: 3000,
    });
    
    return data.transcription;
  } catch (error: any) {
    console.error("Error transcribing video:", error);
    
    // Provide more helpful error messages based on common issues
    let errorMessage = error.message || "Failed to transcribe video content";
    
    // Check for specific error patterns
    if (errorMessage.includes("Invalid file format")) {
      errorMessage = "Invalid audio format. Please ensure your recording has clear audio.";
    } else if (errorMessage.includes("too large")) {
      errorMessage = "Video is too large for transcription. Please record a shorter video.";
    }
    
    toast({
      title: "Transcription failed",
      description: errorMessage,
      variant: "destructive",
      duration: 5000,
    });
    
    throw error;
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
    
    // Log the content structure that will be stored
    console.log("Formatting video content with transcription:", !!transcription);
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
