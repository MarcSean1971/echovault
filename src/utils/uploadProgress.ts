
/**
 * Simulates file upload progress for testing and demonstration purposes.
 * This would be replaced with real upload progress tracking in production.
 */
export function simulateUploadProgress(setProgress: (progress: number) => void): void {
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 10;
    
    if (progress >= 100) {
      clearInterval(interval);
      setProgress(100);
    } else {
      setProgress(Math.min(Math.round(progress), 99)); // Cap at 99 until complete
    }
  }, 300);
}
