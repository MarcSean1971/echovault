import { useState, useEffect } from "react";
import { parseVideoContent } from "@/services/messages/mediaService";
import { Message } from "@/types/message";
import { base64ToBlob, safeCreateObjectURL, safeRevokeObjectURL } from "@/utils/mediaUtils";
import { toast } from "@/components/ui/use-toast";

/**
 * Hook to initialize media content when editing a message
 */
export function useInitializeMediaContent(message: Message | null) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoBase64, setVideoBase64] = useState<string | null>(null); 
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [additionalText, setAdditionalText] = useState<string | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  
  // Parse the message content when the message changes
  useEffect(() => {
    if (!message?.content) {
      console.log("useInitializeMediaContent: No message content to initialize");
      return;
    }
    
    console.log("useInitializeMediaContent: Initializing content for message type:", message.message_type);
    console.log("useInitializeMediaContent: Content preview:", message.content.substring(0, 100) + "...");
    
    // Clear any previous initialization errors
    setInitializationError(null);
    
    // Function to create blob URL with retry mechanism
    const createBlobUrlWithRetry = (blob: Blob, mimeType: string): string => {
      try {
        // Try creating a URL the normal way first
        const url = URL.createObjectURL(blob);
        console.log("Created blob URL successfully:", url.substring(0, 30) + "...");
        return url;
      } catch (e) {
        console.error("Error creating blob URL directly:", e);
        
        try {
          // Try recreating the blob with explicit mime type
          const newBlob = new Blob([blob], { type: mimeType });
          const url = URL.createObjectURL(newBlob);
          console.log("Created blob URL via new blob:", url.substring(0, 30) + "...");
          return url;
        } catch (e2) {
          console.error("Failed to create URL even with new blob:", e2);
          throw e2;
        }
      }
    };
    
    try {
      // Try to handle video content first
      const { videoData, error, diagnostics } = parseVideoContent(message.content);
      
      if (videoData) {
        console.log("Processing video data from message content");
        try {
          // Create a Blob URL for the video player with improved handling
          const blob = base64ToBlob(videoData, 'video/webm');
          console.log("Created video blob of size:", blob.size, "bytes");
          
          // Try to create a URL with retry
          const url = createBlobUrlWithRetry(blob, 'video/webm');
          
          console.log("Created video blob URL:", url);
          console.log("Video blob size:", blob.size);
          setVideoUrl(url);
          setVideoBase64(videoData);
          setVideoBlob(blob);
          
          // Check for additional text
          try {
            const contentObj = JSON.parse(message.content);
            if (contentObj.additionalText) {
              console.log("Found additional text with video:", contentObj.additionalText.substring(0, 50));
              setAdditionalText(contentObj.additionalText);
            }
          } catch (e) {
            console.error("Error parsing additional text from video content:", e);
          }
          
          setHasInitialized(true);
        } catch (e) {
          console.error("Error creating blob from video data:", e);
          setInitializationError(`Failed to create video blob: ${e}`);
          
          // Try one more time with direct approach on failure
          try {
            console.log("Attempting alternate video blob creation approach");
            const binaryString = window.atob(videoData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            
            console.log("Created video blob URL via alternate method:", url);
            setVideoUrl(url);
            setVideoBase64(videoData);
            setVideoBlob(blob);
            setHasInitialized(true);
          } catch (retryError) {
            console.error("Even alternate approach failed:", retryError);
            
            // Show a toast for video initialization error
            toast({
              title: "Video Loading Error",
              description: "There was a problem loading your video. You may need to re-record it.",
              variant: "destructive"
            });
          }
        }
      } else {
        if (error) {
          console.log("Video parsing error:", error, diagnostics);
          
          // If this was expected to be a video message but we failed to parse it
          if (message && message.message_type !== "text") {
            setInitializationError(`Failed to parse video content: ${error}`);
            console.error("Video message initialization failed:", error, diagnostics);
            
            // Only show toast for expected video content
            toast({
              title: "Video Content Error",
              description: "This message is marked as video but contains invalid content. Please re-record your video.",
              variant: "destructive"
            });
          }
        }
        
        // Try audio content next if no video data was found
        try {
          const contentObj = JSON.parse(message.content);
          
          if (contentObj.audioData) {
            console.log("Processing audio data from message content");
            try {
              // Create a Blob URL for the audio player
              const audioBlob = base64ToBlob(contentObj.audioData, 'audio/webm');
              const url = URL.createObjectURL(audioBlob);
              
              console.log("Created audio blob URL:", url);
              console.log("Audio blob size:", audioBlob.size);
              setAudioUrl(url);
              setAudioBase64(contentObj.audioData);
              setAudioBlob(audioBlob);
              
              // Check for additional text
              if (contentObj.additionalText) {
                console.log("Found additional text with audio:", contentObj.additionalText.substring(0, 50));
                setAdditionalText(contentObj.additionalText);
              }
              
              setHasInitialized(true);
            } catch (e) {
              console.error("Error creating blob from audio data:", e);
              setInitializationError(`Failed to create audio blob: ${e}`);
              
              // Show toast for audio initialization error
              toast({
                title: "Audio Loading Error",
                description: "There was a problem loading your audio. You may need to re-record it.",
                variant: "destructive"
              });
            }
          }
        } catch (e) {
          // Not JSON or error parsing audio content
          console.log("Failed to parse audio content:", e);
          
          if (message && message.message_type === "audio") {
            setInitializationError(`Failed to parse audio content: ${e}`);
            console.error("Audio message initialization failed:", e);
            
            // Show toast for audio content error
            toast({
              title: "Audio Content Error",
              description: "This message is marked as audio but contains invalid content. Please re-record your audio.",
              variant: "destructive"
            });
          }
        }
        
        // If it's a text message or we couldn't find media data, treat the content as text
        if (message.message_type === "text" || (!videoUrl && !audioUrl)) {
          console.log("Treating content as text message");
          setAdditionalText(message.content);
          setHasInitialized(true);
          
          // If message type is video/audio but content is text, show a warning
          if (message && message.message_type !== "text") {
            toast({
              title: "Content Type Mismatch",
              description: `This message is marked as ${message.message_type} but contains text content. You may need to re-record your media.`,
              variant: "destructive"
            });
          }
        }
      }
    } catch (e) {
      console.error("Error initializing media content:", e);
      setInitializationError(`General initialization error: ${e}`);
      
      // If we failed but haven't tried many times, try again
      if (attemptCount < 2) {
        console.log("Retrying initialization, attempt:", attemptCount + 1);
        setAttemptCount(prev => prev + 1);
        
        // Try again after a short delay
        setTimeout(() => {
          const retryEvent = new CustomEvent('retry-media-init', { detail: { messageId: message.id } });
          window.dispatchEvent(retryEvent);
        }, 500);
      } else {
        // Show a general error toast
        toast({
          title: "Content Loading Error",
          description: "There was a problem loading your message content. You may need to recreate it.",
          variant: "destructive"
        });
      }
    }
    
    // Cleanup function to revoke object URLs when unmounting
    return () => {
      if (audioUrl) {
        console.log("Revoking audio URL on cleanup");
        safeRevokeObjectURL(audioUrl);
      }
      if (videoUrl) {
        console.log("Revoking video URL on cleanup");
        safeRevokeObjectURL(videoUrl);
      }
    };
  }, [message, attemptCount]);
  
  // Add effect for retry event listener
  useEffect(() => {
    const handleRetry = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (message && customEvent.detail?.messageId === message.id) {
        console.log("Handling retry event for message:", message.id);
        setAttemptCount(prev => prev + 1);
      }
    };
    
    window.addEventListener('retry-media-init', handleRetry);
    return () => window.removeEventListener('retry-media-init', handleRetry);
  }, [message]);
  
  return {
    audioUrl,
    audioBase64,
    audioBlob,
    videoUrl,
    videoBase64,
    videoBlob,
    hasInitialized,
    additionalText,
    initializationError
  };
}
