
/**
 * Format seconds into a MM:SS display format
 */
export const formatDuration = (seconds: number): string => {
  if (isNaN(seconds)) return "00:00";
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Format time in seconds to display format
 */
export const formatTime = (seconds: number): string => {
  return formatDuration(seconds);
};
