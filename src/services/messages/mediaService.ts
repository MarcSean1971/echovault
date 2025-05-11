
/**
 * Extract video data from message content
 */
export const parseVideoContent = (content: string | null): { videoData: string | null; transcription: string | null; } => {
  if (!content) {
    return { videoData: null, transcription: null };
  }
  
  try {
    const contentObj = JSON.parse(content);
    
    // If the content has a direct videoData property
    if (contentObj && contentObj.videoData) {
      return { 
        videoData: contentObj.videoData,
        transcription: contentObj.transcription || null
      };
    }
    
    // If the content has nested videoContent
    if (contentObj && contentObj.videoContent) {
      try {
        const videoContentObj = typeof contentObj.videoContent === 'string' ? 
                             JSON.parse(contentObj.videoContent) : 
                             contentObj.videoContent;
                             
        return {
          videoData: videoContentObj?.videoData || null,
          transcription: videoContentObj?.transcription || null
        };
      } catch (e) {
        console.error("Failed to parse nested videoContent:", e);
      }
    }
  } catch (e) {
    console.error("Failed to parse video content:", e);
  }
  
  return { videoData: null, transcription: null };
};

/**
 * Extract transcription from message content
 */
export const parseMessageTranscription = (content: string | null): string | null => {
  if (!content) return null;
  
  try {
    // First try parsing as JSON
    const contentObj = JSON.parse(content);
    
    // Check for direct transcription
    if (contentObj.transcription) {
      return contentObj.transcription;
    }
    
    // Check for nested video content
    if (contentObj.videoContent) {
      try {
        const videoContentObj = typeof contentObj.videoContent === 'string' ?
                              JSON.parse(contentObj.videoContent) :
                              contentObj.videoContent;
                              
        if (videoContentObj && videoContentObj.transcription) {
          return videoContentObj.transcription;
        }
      } catch (e) {
        console.error("Failed to parse nested videoContent for transcription:", e);
      }
    }
  } catch (e) {
    // Not JSON or parsing error
  }
  
  return null;
};
