
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
    const contentObj = JSON.parse(content);
    if (contentObj.transcription) {
      return contentObj.transcription;
    }
    return content; // Use content as fallback
  } catch (e) {
    // Not JSON or no transcription, use content as is
    return content;
  }
}
