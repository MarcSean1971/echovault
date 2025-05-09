
/**
 * Parse message transcription from any type of content
 */
export function parseMessageTranscription(content: string | null): string | null {
  if (!content) return null;
  
  try {
    // Log the content for debugging
    console.log("Parsing transcription from content:", content.substring(0, 50) + "...");
    
    const contentObj = JSON.parse(content);
    console.log("Content parsed as JSON, checking for transcription field");
    
    if (contentObj.transcription) {
      console.log("Transcription found:", contentObj.transcription.substring(0, 50) + "...");
      return contentObj.transcription;
    } else {
      console.log("No transcription field found in JSON content");
    }
  } catch (e) {
    console.error("Failed to parse content as JSON:", e);
    // Not JSON content, so no transcription
  }
  
  return null;
}

/**
 * Parse video content from a message
 */
export function parseVideoContent(content: string | null): {
  videoData: string | null;
  transcription: string | null;
} {
  if (!content) return { videoData: null, transcription: null };
  
  try {
    const parsedContent = JSON.parse(content);
    console.log("Video content parsed, checking for videoData");
    
    if (parsedContent.videoData) {
      console.log("Video data found, checking for transcription");
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
}
