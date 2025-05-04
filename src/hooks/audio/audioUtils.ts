
/**
 * Checks if the browser supports audio recording
 */
export function checkBrowserSupport(): boolean {
  return !!(navigator.mediaDevices && window.MediaRecorder);
}

/**
 * Returns the optimal audio MIME type based on browser support
 */
export function getOptimalMimeType(): string {
  return MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
}

/**
 * Manages stopping audio tracks and releasing resources
 */
export function stopMediaTracks(stream: MediaStream | null): void {
  if (stream) {
    stream.getTracks().forEach(track => {
      track.stop();
      console.log("Audio track stopped:", track.id);
    });
  }
}
