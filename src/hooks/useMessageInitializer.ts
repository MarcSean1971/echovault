
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
    setAudioUrl, setAudioBase64, setAudioTranscription
  } = useAudioRecordingHandler();
  
  const {
    setVideoUrl, setVideoBase64, setVideoTranscription
  } = useVideoRecordingHandler();

  // Set initial message type based on the message being edited
  useEffect(() => {
    if (message?.message_type) {
      setContextMessageType(message.message_type);
    }
  }, [message, setContextMessageType]);

  // Initialize media content from the message being edited
  useEffect(() => {
    if (!message?.content) return;
    
    if (message.message_type === 'audio' || message.message_type === 'video') {
      try {
        const contentObj = JSON.parse(message.content);
        
        // Initialize audio content
        if (message.message_type === 'audio' && contentObj.audioData) {
          const audioBlob = base64ToBlob(contentObj.audioData, 'audio/webm');
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          setAudioBase64(contentObj.audioData);
          setAudioTranscription(contentObj.transcription || null);
          
          // Important: Set the form content to match the audio data
          setContent(message.content);
        }
        
        // Initialize video content
        if (message.message_type === 'video' && contentObj.videoData) {
          const videoBlob = base64ToBlob(contentObj.videoData, 'video/webm');
          const url = URL.createObjectURL(videoBlob);
          setVideoUrl(url);
          setVideoBase64(contentObj.videoData);
          setVideoTranscription(contentObj.transcription || null);
          
          // Important: Set the form content to match the video data
          setContent(message.content);
        }
      } catch (e) {
        console.log("Error parsing message content:", e);
      }
    } else if (message.message_type === 'text' && message.content) {
      // For text messages, just set the content directly
      setContent(message.content);
    }
  }, [message, setAudioUrl, setAudioBase64, setAudioTranscription, setVideoUrl, setVideoBase64, setVideoTranscription, setContent]);

  // Helper function to convert base64 to blob
  const base64ToBlob = (base64: string, type: string): Blob => {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type });
  };
}
