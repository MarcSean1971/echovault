
import { useState } from 'react';
import { useMessageForm } from '@/components/message/MessageFormContext';
import { useAudioRecordingHandler } from './useAudioRecordingHandler';
import { useVideoRecordingHandler } from './useVideoRecordingHandler';
import { transcribeAudio, transcribeVideo } from '@/services/messages/transcriptionService';
import { toast } from '@/components/ui/use-toast';

export function useContentUpdater() {
  const { setContent } = useMessageForm();
  const [isTranscribingAudio, setIsTranscribingAudio] = useState(false);
  const [isTranscribingVideo, setIsTranscribingVideo] = useState(false);
  
  const { clearAudio, setAudioTranscription, setAudioUrl } = useAudioRecordingHandler();
  const { clearVideo, setVideoTranscription } = useVideoRecordingHandler();

  // Handle updating audio content
  const handleAudioContentUpdate = async (audioBlob: Blob, audioBase64: string) => {
    console.log("Handling audio content update, blob size:", audioBlob.size);
    setIsTranscribingAudio(true);
    
    try {
      // Create URL for immediate playback
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(audioUrl);
      console.log("Created audio URL for playback:", audioUrl);
      
      // Start transcribing the audio
      const transcription = await transcribeAudio(audioBase64);
      console.log("Audio transcription completed:", transcription);
      setAudioTranscription(transcription);
      
      // Create audio content object with transcription
      const contentObj = {
        audioData: audioBase64,
        transcription
      };
      
      // Update form content
      setContent(JSON.stringify(contentObj));
      
      toast({
        title: "Audio transcription complete",
        description: "Your audio has been successfully transcribed.",
      });
      
      return contentObj;
    } catch (error) {
      console.error("Error transcribing audio:", error);
      toast({
        title: "Transcription failed",
        description: "Could not transcribe audio. Audio will be saved without transcription.",
        variant: "destructive"
      });
      
      // Still save audio data without transcription
      const contentObj = {
        audioData: audioBase64,
        transcription: null
      };
      setContent(JSON.stringify(contentObj));
      return contentObj;
    } finally {
      setIsTranscribingAudio(false);
    }
  };
  
  // Handle updating video content
  const handleVideoContentUpdate = async (videoBlob: Blob, videoBase64: string) => {
    console.log("Handling video content update, blob size:", videoBlob.size);
    setIsTranscribingVideo(true);
    
    try {
      // Create URL for immediate playback
      const videoUrl = URL.createObjectURL(videoBlob);
      setVideoUrl(videoUrl);
      console.log("Created video URL for playback:", videoUrl);
      
      // Start transcribing the video
      const transcription = await transcribeVideo(videoBase64);
      console.log("Video transcription completed:", transcription);
      setVideoTranscription(transcription);
      
      // Create video content object with transcription
      const contentObj = {
        videoData: videoBase64,
        transcription
      };
      
      // Update form content
      setContent(JSON.stringify(contentObj));
      
      toast({
        title: "Video transcription complete",
        description: "Your video has been successfully transcribed.",
      });
      
      return contentObj;
    } catch (error) {
      console.error("Error transcribing video:", error);
      toast({
        title: "Transcription failed",
        description: "Could not transcribe video. Video will be saved without transcription.",
        variant: "destructive"
      });
      
      // Still save video data without transcription
      const contentObj = {
        videoData: videoBase64,
        transcription: null
      };
      setContent(JSON.stringify(contentObj));
      return contentObj;
    } finally {
      setIsTranscribingVideo(false);
    }
  };

  // Clear audio content
  const handleClearAudio = () => {
    clearAudio();
    setContent("");
  };
  
  // Clear video content
  const handleClearVideo = () => {
    clearVideo();
    setContent("");
  };
  
  return {
    handleAudioContentUpdate,
    handleVideoContentUpdate,
    handleClearAudio,
    handleClearVideo,
    isTranscribingAudio,
    isTranscribingVideo
  };
}
