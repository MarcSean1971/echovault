
/**
 * Parse message transcription from any type of content
 */
export function parseMessageTranscription(content: string | null): string | null {
  if (!content) return null;
  
  try {
    const contentObj = JSON.parse(content);
    return contentObj.transcription || null;
  } catch (e) {
    // Not JSON content, so no transcription
    return null;
  }
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
}
