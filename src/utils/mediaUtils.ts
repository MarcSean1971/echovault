
/**
 * Format time in seconds to MM:SS format
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Log video element properties for debugging
 * This helps identify issues with video playback
 */
export function debugVideoElement(videoElement: HTMLVideoElement | null): void {
  if (!videoElement) {
    console.log("Video Element Debug: Element is null");
    return;
  }
  
  console.log("Video Element Debug:", {
    duration: videoElement.duration,
    currentTime: videoElement.currentTime,
    paused: videoElement.paused,
    ended: videoElement.ended,
    readyState: videoElement.readyState,
    networkState: videoElement.networkState,
    error: videoElement.error,
    src: videoElement.src ? videoElement.src.substring(0, 30) + "..." : "none"
  });
}
