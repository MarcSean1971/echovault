import { useState, useCallback, useRef } from 'react';
import { useVideoTimer } from './useVideoTimer';
import { MediaStreamType } from './types';
import { formatTime } from '@/utils/mediaUtils';

interface UseVideoRecordingControlsProps {
  mediaType?: 'video' | 'audio';
  stream?: MediaStreamType;
  onRecordingComplete?: (blob: Blob, base64: string) => void;
}

export const useVideoRecordingControls = ({
  mediaType = 'video',
  stream,
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

  const startRecording = useCallback(async () => {
    if (!stream) {
      console.error('No stream available to record.');
      return;
    }

    recordedChunksRef.current = [];
    const options: MediaRecorderOptions = { mimeType: 'video/webm;codecs=vp9,opus' };

    try {
      mediaRecorderRef.current = new MediaRecorder(stream, options);
    } catch (e: any) {
      console.error('MediaRecorder creation error:', e);
      return;
    }

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = async () => {
      if (recordedChunksRef.current.length > 0) {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        setVideoBlob(blob);
        const url = URL.createObjectURL(blob);
        setVideoURL(url);

        // Convert Blob to Base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          if (onRecordingComplete) {
            onRecordingComplete(blob, base64data);
          }
        };
        reader.readAsDataURL(blob);
      }
    };

    mediaRecorderRef.current.onerror = (event) => {
      console.error("MediaRecorder error:", event.error);
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
    setIsPaused(false);
    startTimer();
  }, [stream, startTimer, onRecordingComplete]);

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
        recordedVideoRef.current.play();
        setIsPlaying(true);
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
  }, [resetTimer, videoURL]);

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
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    togglePlayback,
    handleVideoEnded,
    reset,
    handleAccept,
  };
};
