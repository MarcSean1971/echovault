
import { useState, useRef } from "react";

/**
 * Manages state for audio recording
 */
export function useAudioRecordingState() {
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  
  return {
    // State
    isRecording,
    setIsRecording,
    isPaused,
    setIsPaused,
    recordingDuration,
    setRecordingDuration,
    audioURL,
    setAudioURL,
    audioBlob,
    setAudioBlob,
    permissionDenied,
    setPermissionDenied,
    
    // Refs
    mediaRecorderRef,
    audioChunksRef,
    streamRef
  };
}
