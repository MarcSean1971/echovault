
/**
 * Utility functions for file operations
 */

/**
 * Format a file size in bytes to a human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  else return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};

/**
 * Get method name from access method type
 */
export const getMethodName = (method: 'secure' | 'signed' | 'direct'): string => {
  switch (method) {
    case 'secure':
      return "Edge Function";
    case 'signed':
      return "Signed URL";
    case 'direct':
      return "Direct URL";
    default:
      return "Unknown";
  }
};

/**
 * Get badge variant based on access method
 */
export const getBadgeVariant = (method: 'secure' | 'signed' | 'direct'): string => {
  switch (method) {
    case 'secure':
      return "default"; // Green for secure (edge function)
    case 'signed':
      return "secondary"; // Grey for signed URL
    case 'direct':
      return "destructive"; // Red for direct (less secure)
    default:
      return "outline";
  }
};
