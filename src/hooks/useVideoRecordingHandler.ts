
import { useMediaRecording } from "./useMediaRecording";

export function useVideoRecordingHandler() {
  const {
    showRecorder: showVideoRecorder,
    setShowRecorder: setShowVideoRecorder,
    mediaBlob: videoBlob,
    mediaBase64: videoBase64,
    mediaUrl: videoUrl,
    isTranscribing: isTranscribingVideo,
    transcription: videoTranscription,
    handleMediaReady,
    clearMedia,
    setMediaUrl: setVideoUrl,
    setTranscription: setVideoTranscription,
    setMediaBase64: setVideoBase64,
    setMediaBlob: setVideoBlob
  } = useMediaRecording("video");
  
  // Wrapper functions with video-specific naming
  const handleVideoReady = async (videoBlob: Blob, videoBase64: string) => {
    return handleMediaReady(videoBlob, videoBase64);
  };
  
  const clearVideo = () => {
    return clearMedia();
  };
  
  return {
    showVideoRecorder,
    setShowVideoRecorder,
    videoBlob,
    videoBase64,
    videoUrl,
    isTranscribingVideo,
    videoTranscription,
    handleVideoReady,
    clearVideo,
    setVideoUrl,
    setVideoTranscription,
    setVideoBase64,
    setVideoBlob
  };
}
