
/**
 * Parse video content from a message
 */
export function parseVideoContent(content: string | null): {
  videoData: string | null;
} {
  if (!content) return { videoData: null };
  
  try {
    const parsedContent = JSON.parse(content);
    console.log("Video content parsed, checking for videoData");
    
    if (parsedContent.videoData) {
      console.log("Video data found");
      
      return {
        videoData: parsedContent.videoData
      };
    }
  } catch (e) {
    // Not JSON or invalid format
    console.log("Content is not video format:", e);
  }
  
  return { videoData: null };
}
