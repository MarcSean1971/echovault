
interface MediaRecordersProps {
  showVideoRecorder: boolean;
  setShowVideoRecorder: (show: boolean) => void;
  onVideoContentUpdate: (videoBlob: Blob, videoBase64: string) => Promise<any>;
  videoUrl: string | null;
  videoBlob: Blob | null;
}

export function MediaRecorders({ 
  showVideoRecorder, 
  setShowVideoRecorder,
  onVideoContentUpdate,
  videoUrl,
  videoBlob
}: MediaRecordersProps) {
  // Video functionality removed
  return null;
}
