
import { supabase } from "@/integrations/supabase/client";

/**
 * Transcribe audio data using OpenAI via Supabase Edge Function
 * 
 * @param audioBase64 Base64 encoded audio data
 * @param audioType MIME type of the audio
 * @returns Transcription text
 */
export async function transcribeAudio(audioBase64: string, audioType: string = 'audio/webm') {
  try {
    const { data, error } = await supabase.functions.invoke('transcribe-audio', {
      body: { audioData: audioBase64, audioType }
    });
    
    if (error) throw error;
    
    if (data.success && data.text) {
      return data.text;
    } else {
      throw new Error("Transcription failed or returned empty");
    }
  } catch (err) {
    console.error("Error transcribing audio:", err);
    throw err;
  }
}

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
