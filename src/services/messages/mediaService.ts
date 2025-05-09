
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Get signed URL for message attachment media
 */
export async function getMessageMedia(attachment: { path: string } | undefined) {
  if (!attachment?.path) return { url: null, error: "No attachment path" };
  
  try {
    // Try both message-attachments and message_attachments buckets
    let mediaData;
    try {
      mediaData = await supabase.storage
        .from('message-attachments')
        .createSignedUrl(attachment.path, 3600);
    } catch (error) {
      console.error("Error with message-attachments bucket:", error);
      
      // Try with underscore
      mediaData = await supabase.storage
        .from('message_attachments')
        .createSignedUrl(attachment.path, 3600);
    }
    
    if (mediaData.error) {
      throw mediaData.error;
    }

    return { url: mediaData.data.signedUrl, error: null };
  } catch (error) {
    console.error("Error getting media URL:", error);
    return { 
      url: null, 
      error: "Could not load the media file. The storage bucket might not exist or the file is not accessible." 
    };
  }
}

/**
 * Parse message content for transcription
 */
export function parseMessageTranscription(content: string | null): string | null {
  if (!content) return null;
  
  try {
    console.log("Parsing message content for transcription:", content);
    const contentObj = JSON.parse(content);
    
    if (contentObj.transcription) {
      console.log("Found transcription in content:", contentObj.transcription);
      return contentObj.transcription;
    } else {
      console.log("No transcription found in content");
      return null;
    }
  } catch (e) {
    console.log("Content is not valid JSON or has no transcription");
    return null;
  }
}
