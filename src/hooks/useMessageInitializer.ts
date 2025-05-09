
import { useEffect } from "react";
import { useMessageForm } from "@/components/message/MessageFormContext";
import { useAudioRecordingHandler } from "./useAudioRecordingHandler";
import { useVideoRecordingHandler } from "./useVideoRecordingHandler";
import { Message } from "@/types/message";

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

  // Initialize media content from the message being edited
  useEffect(() => {
    if (!message?.content) return;
    
    console.log("Initializing message content:", message.content);
    
    if (message.message_type === 'audio' || message.message_type === 'video') {
      try {
        const contentObj = JSON.parse(message.content);
        console.log("Parsed content object:", contentObj);
        
        // Initialize audio content
        if (message.message_type === 'audio' && contentObj.audioData) {
          console.log("Found audio data, initializing audio content");
          const audioBlob = base64ToBlob(contentObj.audioData, 'audio/webm');
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          setAudioBase64(contentObj.audioData);
          if (contentObj.transcription) {
            console.log("Found audio transcription:", contentObj.transcription);
            setAudioTranscription(contentObj.transcription);
          }
          setAudioBlob(audioBlob); // Also set the audio blob for use in the recorder
          
          // Important: Set the form content to match the audio data
          setContent(message.content);
        }
        
        // Initialize video content
        if (message.message_type === 'video' && contentObj.videoData) {
          console.log("Found video data, initializing video content");
          const videoBlob = base64ToBlob(contentObj.videoData, 'video/webm');
          const url = URL.createObjectURL(videoBlob);
          setVideoUrl(url);
          setVideoBase64(contentObj.videoData);
          if (contentObj.transcription) {
            console.log("Found video transcription:", contentObj.transcription);
            setVideoTranscription(contentObj.transcription);
          }
          setVideoBlob(videoBlob); // Also set the video blob for use in the recorder
          
          // Important: Set the form content to match the video data
          setContent(message.content);
        }
      } catch (e) {
        console.error("Error parsing message content:", e);
      }
    } else if (message.message_type === 'text' && message.content) {
      // For text messages, just set the content directly
      setContent(message.content);
    }
    
    // Cleanup function to revoke object URLs when unmounting
    return () => {
      // Cleanup will happen in the individual hooks
    };
  }, [message, setAudioUrl, setAudioBase64, setAudioTranscription, setAudioBlob,
      setVideoUrl, setVideoBase64, setVideoTranscription, setVideoBlob, setContent]);

  // Helper function to convert base64 to blob
  const base64ToBlob = (base64: string, type: string): Blob => {
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
  };
}
