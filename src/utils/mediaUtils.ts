
/**
 * Format time in seconds to a display format (MM:SS)
 */
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

/**
 * Safely creates object URL with error handling
 */
export const safeCreateObjectURL = (blob: Blob | null): string => {
  if (!blob) return '';
  try {
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error creating object URL:', error);
    return '';
  }
};

/**
 * Safely revokes object URL with error handling
 */
export const safeRevokeObjectURL = (url: string): void => {
  if (!url) return;
  try {
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error revoking object URL:', error);
  }
};

/**
 * Convert a Blob to base64 string
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Format file size into human-readable string
 */
export const formatFileSize = (sizeInBytes: number): string => {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  } else if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
};
