
/**
 * Format a time in seconds to a string in MM:SS format
 * @param seconds Time in seconds
 * @returns Formatted time string (MM:SS)
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Convert a Blob to base64 string
 * @param blob The blob to convert
 * @returns Promise resolving to base64 string
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert base64 string to Blob
 * @param base64 The base64 string to convert
 * @param type MIME type for the blob
 * @returns Blob created from the base64 string
 */
export function base64ToBlob(base64: string, type: string): Blob {
  try {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type });
  } catch (e) {
    console.error("Error in base64ToBlob:", e);
    throw new Error(`Failed to convert base64 to blob: ${e}`);
  }
}

/**
 * Safe wrapper for URL.createObjectURL that catches errors
 * @param blob The blob to create a URL for
 * @returns URL string or null if creation failed
 */
export function safeCreateObjectURL(blob: Blob | null): string | null {
  if (!blob) return null;
  
  try {
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error("Error creating object URL:", e);
    return null;
  }
}

/**
 * Safely revoke an object URL
 * @param url The URL to revoke
 */
export function safeRevokeObjectURL(url: string | null): void {
  if (!url) return;
  
  try {
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error("Error revoking object URL:", e);
  }
}
