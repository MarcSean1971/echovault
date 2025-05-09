
/**
 * Parse video content from message content JSON
 */
export function parseVideoContent(content: string) {
  try {
    const contentObj = JSON.parse(content);
    return {
      videoData: contentObj.videoData || null,
      transcription: contentObj.transcription || null
    };
  } catch (e) {
    console.error("Error parsing video content:", e);
    return {
      videoData: null,
      transcription: null
    };
  }
}

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
