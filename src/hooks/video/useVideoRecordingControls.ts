
import { useState, useCallback, useRef } from 'react';
import { useVideoTimer } from './useVideoTimer';
import { MediaStreamType } from './types';
import { formatTime } from '@/utils/mediaUtils';

interface UseVideoRecordingControlsProps {
  mediaType?: 'video';
  stream?: MediaStreamType;
  streamReady?: boolean;
  startRecording?: () => void;
  resetRecording?: () => void;
  videoBlob?: Blob | null; 
  stopStream?: () => void;
  initializeStream?: () => Promise<boolean>;
  onRecordingComplete?: (blob: Blob, base64: string) => void;
}

export const useVideoRecordingControls = ({
  mediaType = 'video',
  stream,
  streamReady = false,
  startRecording,
  resetRecording,
  videoBlob,
  stopStream,
  initializeStream,
  onRecordingComplete,
}: UseVideoRecordingControlsProps = {}) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);

  const { recordingDuration, startTimer, stopTimer, resetTimer } = useVideoTimer();

  const recordedVideoRef = useRef<HTMLVideoElement>(null);

  const safeStartRecording = useCallback(() => {
    if (!streamReady || !startRecording) {
      console.log('Stream not ready or startRecording function not provided');
      return;
    }

    console.log('Starting recording safely');
    startRecording();
  }, [streamReady, startRecording]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      stopTimer();
    }
  }, [stopTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimer();
    }
  }, [startTimer]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      stopTimer();
    }
  }, [stopTimer]);

  const togglePlayback = useCallback(() => {
    if (recordedVideoRef.current) {
      if (recordedVideoRef.current.paused) {
        recordedVideoRef.current.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.error("Error playing video:", err);
          });
      } else {
        recordedVideoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, []);

  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const reset = useCallback(() => {
    if (videoURL) {
      URL.revokeObjectURL(videoURL);
    }
    setVideoURL(null);
    setVideoBlob(null);
    setIsPlaying(false);
    resetTimer();
    
    if (resetRecording) {
      resetRecording();
    }
  }, [resetTimer, videoURL, resetRecording]);

  const handleAccept = useCallback(async (): Promise<{ videoBlob: Blob; base64Video: string } | null> => {
    return new Promise((resolve) => {
      if (!videoBlob) {
        console.warn("No video blob available to accept.");
        resolve(null);
        return;
      }

      // Convert Blob to Base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        resolve({ videoBlob, base64Video: base64data });
      };
      reader.onerror = () => {
        console.error("Failed to read blob as data URL");
        resolve(null);
      };
      reader.readAsDataURL(videoBlob);
    });
  }, [videoBlob]);

  return {
    isRecording,
    isPaused,
    isPlaying,
    recordingDuration: formatTime(recordingDuration),
    videoURL,
    videoBlob,
    recordedVideoRef,
    startRecording: safeStartRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    togglePlayback,
    handleVideoEnded,
    reset,
    handleAccept,
  };
};
