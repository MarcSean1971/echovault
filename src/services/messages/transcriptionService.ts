
import { supabase } from "@/integrations/supabase/client";

/**
 * Process video data for transcription using OpenAI via Supabase Edge Function
 * 
 * @param videoBase64 Base64 encoded video data
 * @param videoType MIME type of the video
 * @returns Transcription text
 */
export async function transcribeVideo(videoBase64: string, videoType: string = 'video/webm') {
  try {
    const { data, error } = await supabase.functions.invoke('process-video', {
      body: { videoData: videoBase64, videoType }
    });
    
    if (error) throw error;
    
    if (data.success && data.text) {
      return data.text;
    } else {
      throw new Error("Video transcription failed or returned empty");
    }
  } catch (err) {
    console.error("Error transcribing video:", err);
    throw err;
  }
}
