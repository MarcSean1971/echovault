
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
