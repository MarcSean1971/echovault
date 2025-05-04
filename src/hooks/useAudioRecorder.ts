
import { useAudioRecorder as useAudioRecorderImpl } from "./audio";

export function useAudioRecorder(options?: {
  onRecordingComplete?: (blob: Blob, audioURL: string) => void;
}) {
  return useAudioRecorderImpl(options);
}
