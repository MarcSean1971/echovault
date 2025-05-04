
export interface UseAudioRecorderOptions {
  onRecordingComplete?: (blob: Blob, audioURL: string) => void;
}

export interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  isPlaying: boolean;
  recordingDuration: number;
  audioURL: string | null;
  audioBlob: Blob | null;
  isBrowserSupported: boolean;
  permissionDenied: boolean;
}
