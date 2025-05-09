
import { MutableRefObject } from "react";

export type MediaStreamType = MediaStream | null;

export interface VideoRecordingOptions {
  timeslice?: number;
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
}

export interface VideoRecorderHookResult {
  // State
  isRecording: boolean;
  isPaused: boolean;
  isPlaying: boolean;
  recordingDuration: string;
  videoURL: string | null;
  videoBlob: Blob | null;
  isBrowserSupported: boolean;
  isInitializing: boolean;
  streamReady: boolean;
  stream: MediaStream | null;
  permissionDenied: boolean;
  
  // Refs
  videoPreviewRef: MutableRefObject<HTMLVideoElement | null>;
  recordedVideoRef: MutableRefObject<HTMLVideoElement | null>;
  
  // Methods
  startRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  togglePlayback: () => void;
  handleVideoEnded: () => void;
  reset: () => void;
  handleAccept: () => Promise<{ videoBlob: Blob, base64Video: string } | null>;
  reinitializeStream: () => Promise<boolean>;
  initializeStream: () => Promise<boolean>;
}

export interface MediaRecorderHookResult {
  isRecording: boolean;
  isPaused: boolean;
  recordingDuration: number;
  recordedBlob: Blob | null;
  recordedUrl: string | null;
  startRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  resetRecording: () => void;
  cleanup: () => void;
}

export interface RecordingOptions {
  onRecordingComplete?: (blob: Blob, url: string) => void;
  mimeType?: string;
  timeslice?: number;
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
}
