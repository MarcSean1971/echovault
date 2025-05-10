
/**
 * Parse video content from a message
 */
export function parseVideoContent(content: string | null): {
  videoData: string | null;
  error?: string;
  diagnostics?: any;
} {
  if (!content) return { videoData: null };
  
  try {
    // First check if the content is JSON
    if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
      try {
        const parsedContent = JSON.parse(content);
        console.log("Video content parsed as JSON, checking for videoData");
        
        if (parsedContent.videoData) {
          console.log("Video data found in JSON");
          
          return {
            videoData: parsedContent.videoData
          };
        } else {
          console.log("No videoData property found in JSON content");
          return { 
            videoData: null, 
            error: "No videoData property in JSON",
            diagnostics: { 
              contentType: "json", 
              contentStart: content.substring(0, 50),
              hasVideoData: false
            }
          };
        }
      } catch (e) {
        console.log("Content appears to be JSON format but failed to parse:", e);
        return { 
          videoData: null, 
          error: "Failed to parse JSON", 
          diagnostics: { 
            contentType: "invalid-json", 
            contentStart: content.substring(0, 50),
            error: String(e)
          } 
        };
      }
    } else {
      // Not JSON format, might be direct base64 or other format
      console.log("Content is not in JSON format, might be direct data");
      return { 
        videoData: null, 
        error: "Content is not in JSON format",
        diagnostics: { 
          contentType: "non-json", 
          contentStart: content.substring(0, 50) 
        }
      };
    }
  } catch (e) {
    // Unexpected error
    console.error("Unexpected error parsing video content:", e);
    return { 
      videoData: null, 
      error: "Unexpected error parsing content", 
      diagnostics: { 
        contentType: "unknown", 
        error: String(e),
        contentStart: content?.substring(0, 50)
      } 
    };
  }
}
