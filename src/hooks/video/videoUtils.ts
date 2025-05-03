
/**
 * Gets a supported MIME type for video recording
 */
export const getSupportedVideoMimeType = (): string => {
  const defaultType = 'video/webm';
  const preferredTypes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=h264,opus',
    'video/webm',
    'video/mp4'
  ];
  
  for (const type of preferredTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      console.log(`Using supported mime type: ${type}`);
      return type;
    }
  }
  
  console.log(`Defaulting to mime type: ${defaultType}`);
  return defaultType;
};

/**
 * Checks if the browser supports video recording
 */
export const checkBrowserSupport = (): boolean => {
  return !!(navigator.mediaDevices && window.MediaRecorder);
};

/**
 * Format time in MM:SS format
 */
export const formatRecordingTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

