
export function useContentHandler() {
  const prepareContent = (messageType: string, textContent: string | undefined, videoContent: string | undefined, content: string | null) => {
    // Log the current state of content before saving
    console.log("Message edit - content state before save:", {
      messageType,
      hasTextContent: !!textContent && textContent.trim() !== '',
      hasVideoContent: !!videoContent && videoContent.trim() !== '',
      textContentLength: textContent?.length || 0,
      videoContentLength: videoContent?.length || 0,
      content: content ? content.substring(0, 30) + "..." : "none"
    });
    
    // Check if we have valid video content
    const hasValidVideo = videoContent && 
      (videoContent.includes('videoData') || 
        (videoContent.startsWith('{') && videoContent.endsWith('}')));
    
    // Check if we have valid text content
    const hasValidText = textContent && textContent.trim() !== '';
    
    let contentToSave = null;
    let finalMessageType = messageType;
    let finalTextContent = textContent;
    let finalVideoContent = videoContent;
    
    // For backward compatibility, generate the merged content as well
    if (hasValidVideo && hasValidText) {
      // We have both video and text content - combine them for legacy content field
      console.log("Saving both video and text content separately");
      
      // For legacy content field, combine them
      try {
        // Parse the video content to add text content to it
        const videoContentObj = JSON.parse(videoContent);
        videoContentObj.additionalText = textContent;
        contentToSave = JSON.stringify(videoContentObj);
        // When we have both, use video as the primary type for correct rendering
        finalMessageType = "video";
        console.log("Combined content created with both text and video for legacy content field");
      } catch (error) {
        console.error("Error combining text and video content:", error);
        // Fallback to using the selected tab's content for legacy field
        contentToSave = messageType === "video" ? videoContent : textContent;
      }
    } else if (hasValidVideo) {
      // Only video content available
      console.log("Saving video content only");
      contentToSave = videoContent;
      finalMessageType = "video";
    } else if (hasValidText) {
      // Only text content available
      console.log("Saving text content only");
      contentToSave = textContent;
      finalMessageType = "text";
    } else {
      // No valid content - this should not normally happen
      console.log("No valid content found to save");
      contentToSave = content; // Use whatever was there before
    }
    
    console.log("Final content to save:", {
      legacyContent: contentToSave ? contentToSave.substring(0, 30) + "..." : "none",
      textContent: finalTextContent ? finalTextContent.substring(0, 30) + "..." : "none",
      videoContent: finalVideoContent ? "present (length: " + finalVideoContent.length + ")" : "none",
      messageType: finalMessageType
    });

    return {
      contentToSave,
      finalMessageType,
      finalTextContent,
      finalVideoContent
    };
  };

  return {
    prepareContent
  };
}
