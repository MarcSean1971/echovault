
import { useEffect, useCallback } from "react";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { useAudioRecordingHandler } from "./useAudioRecordingHandler";
import { useVideoRecordingHandler } from "./useVideoRecordingHandler";
import { Message } from "@/types/message";
import { parseAudioContent, parseVideoContent } from "@/services/messages/mediaService";
import { toast } from "@/components/ui/use-toast";

/**
 * Hook to initialize message data when editing an existing message
 */
export function useMessageInitializer(message?: Message) {
  const { 
    setMessageType: setContextMessageType,
    setContent
  } = useMessageForm();
  
  const {
    setAudioUrl, setAudioBase64, setAudioTranscription, setAudioBlob
  } = useAudioRecordingHandler();
  
  const {
    setVideoUrl, setVideoBase64, setVideoTranscription, setVideoBlob
  } = useVideoRecordingHandler();

  // Set initial message type based on the message being edited
  useEffect(() => {
    if (message?.message_type) {
      console.log("Initializing message type:", message.message_type);
      setContextMessageType(message.message_type);
    }
  }, [message, setContextMessageType]);
  
  // Helper function to convert base64 to blob
  const base64ToBlob = useCallback((base64: string, type: string): Blob => {
    try {
      const binaryString = window.atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new Blob([bytes], { type });
    } catch (e) {
      console.error("Error converting base64 to blob:", e);
      return new Blob([], { type });
    }
  }, []);

  // Initialize media content from the message being edited
  useEffect(() => {
    if (!message?.content) return;
    
    console.log("Initializing message content for editing:", message.content.substring(0, 100) + "...");
    console.log("Message type:", message.message_type);
    
    // Cleanup URLs on unmount or message change
    const createdUrls: string[] = [];
    
    try {
      // Set form content regardless of message type
      setContent(message.content);
      
      if (message.message_type === 'audio') {
        const { audioData, transcription } = parseAudioContent(message.content);
        
        console.log("Found audio data:", !!audioData);
        console.log("Found transcription:", transcription);
        
        if (audioData) {
          try {
            // Create blob and URL
            const audioBlob = base64ToBlob(audioData, 'audio/webm');
            console.log("Created audio blob:", audioBlob.size);
            
            // First clean up any existing URL
            try {
              const currentUrl = document.querySelector('audio')?.src;
              if (currentUrl && currentUrl.startsWith('blob:')) {
                URL.revokeObjectURL(currentUrl);
              }
            } catch (e) {
              console.error("Error cleaning up existing audio URL:", e);
            }
            
            const url = URL.createObjectURL(audioBlob);
            createdUrls.push(url);
            console.log("Created audio URL for editing:", url);
            
            // Set state
            setAudioUrl(url);
            setAudioBase64(audioData);
            setAudioBlob(audioBlob);
            
            if (transcription) {
              console.log("Setting audio transcription:", transcription);
              setAudioTranscription(transcription);
            }
            
            // Verify the URL works
            const audio = new Audio(url);
            audio.onloadedmetadata = () => {
              console.log("Audio loaded successfully with duration:", audio.duration);
            };
            audio.onerror = (e) => {
              console.error("Error loading audio:", e);
              // Try recreating the URL
              const newUrl = URL.createObjectURL(audioBlob);
              createdUrls.push(newUrl);
              setAudioUrl(newUrl);
              console.log("Recreated audio URL after error:", newUrl);
            };
            
            // Show toast to confirm loading
            toast({
              title: "Audio loaded",
              description: "Your audio message has been loaded successfully."
            });
          } catch (error) {
            console.error("Error processing audio data:", error);
            toast({
              title: "Audio Error",
              description: "Failed to load audio data. You may need to re-record.",
              variant: "destructive"
            });
          }
        }
      } else if (message.message_type === 'video') {
        const { videoData, transcription } = parseVideoContent(message.content);
        
        console.log("Found video data:", !!videoData);
        console.log("Found transcription:", transcription);
        
        if (videoData) {
          try {
            // Create blob and URL
            const videoBlob = base64ToBlob(videoData, 'video/webm');
            console.log("Created video blob:", videoBlob.size);
            
            const url = URL.createObjectURL(videoBlob);
            createdUrls.push(url);
            console.log("Created video URL:", url);
            
            // Set state
            setVideoUrl(url);
            setVideoBase64(videoData);
            setVideoBlob(videoBlob);
            
            if (transcription) {
              setVideoTranscription(transcription);
            }
            
            // Show toast to confirm loading
            toast({
              title: "Video loaded",
              description: "Your video message has been loaded successfully."
            });
          } catch (error) {
            console.error("Error processing video data:", error);
            toast({
              title: "Video Error",
              description: "Failed to load video data. You may need to re-record.",
              variant: "destructive"
            });
          }
        }
      }
    } catch (e) {
      console.error("Error initializing message content:", e);
      toast({
        title: "Error",
        description: "There was a problem loading your message content",
        variant: "destructive"
      });
    }
    
    // Cleanup function to revoke object URLs when unmounting or when message changes
    return () => {
      console.log("Cleaning up URLs:", createdUrls);
      createdUrls.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          console.error("Error revoking URL:", e);
        }
      });
    };
  }, [message, setContent, base64ToBlob, setAudioUrl, setAudioBase64, setAudioTranscription, setAudioBlob,
      setVideoUrl, setVideoBase64, setVideoTranscription, setVideoBlob]);
}
