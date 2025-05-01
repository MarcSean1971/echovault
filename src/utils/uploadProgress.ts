
type ProgressCallback = (progress: number) => void;

export function simulateUploadProgress(setProgress: ProgressCallback): void {
  setProgress(0);
  let progressValue = 0;
  
  const interval = setInterval(() => {
    progressValue += 5;
    
    if (progressValue >= 100) {
      clearInterval(interval);
      setProgress(100);
    } else {
      setProgress(progressValue);
    }
  }, 200);
}
