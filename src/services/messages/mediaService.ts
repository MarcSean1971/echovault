
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
    console.log("Parsing message content for transcription:", content.substring(0, 50) + "...");
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

/**
 * Parse audio content from message
 */
export function parseAudioContent(content: string | null) {
  if (!content) return { audioData: null, transcription: null };
  
  try {
    console.log("Parsing audio content from message:", content.substring(0, 50) + "...");
    const contentObj = JSON.parse(content);
    return {
      audioData: contentObj.audioData || null,
      transcription: contentObj.transcription || null
    };
  } catch (e) {
    console.error("Error parsing audio content:", e);
    return { audioData: null, transcription: null };
  }
}

/**
 * Parse video content from message
 */
export function parseVideoContent(content: string | null) {
  if (!content) return { videoData: null, transcription: null };
  
  try {
    console.log("Parsing video content from message:", content.substring(0, 50) + "...");
    const contentObj = JSON.parse(content);
    return {
      videoData: contentObj.videoData || null,
      transcription: contentObj.transcription || null
    };
  } catch (e) {
    console.error("Error parsing video content:", e);
    return { videoData: null, transcription: null };
  }
}

/**
 * Create audio/video blob URL from base64 data
 */
export function createMediaUrl(base64Data: string | null, mediaType: 'audio' | 'video'): string | null {
  if (!base64Data) return null;
  
  try {
    // Convert base64 to blob
    const binaryString = window.atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const type = mediaType === 'audio' ? 'audio/webm' : 'video/webm';
    const blob = new Blob([bytes], { type });
    const url = URL.createObjectURL(blob);
    
    console.log(`Created ${mediaType} URL from base64:`, url);
    return url;
  } catch (e) {
    console.error(`Error creating ${mediaType} URL from base64:`, e);
    toast({
      title: "Media Error",
      description: `Could not create ${mediaType} playback. Please try again.`,
      variant: "destructive"
    });
    return null;
  }
}

/**
 * Convert base64 to blob object
 */
export function base64ToBlob(base64Data: string, mimeType: string): Blob | null {
  try {
    if (!base64Data) {
      throw new Error("Base64 data is empty");
    }
    
    const binaryString = window.atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return new Blob([bytes], { type: mimeType });
  } catch (e) {
    console.error("Error converting base64 to blob:", e);
    toast({
      title: "Processing Error",
      description: "Failed to process media data",
      variant: "destructive"
    });
    return null;
  }
}
