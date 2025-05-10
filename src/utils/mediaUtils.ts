
/**
 * Create an object URL from a blob
 */
export const safeCreateObjectURL = (blob: Blob): string => {
  try {
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error('Error creating object URL:', e);
    return '';
  }
};

/**
 * Revoke an object URL safely
 */
export const safeRevokeObjectURL = (url: string): void => {
  try {
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Error revoking object URL:', e);
  }
};

/**
 * Convert a base64 string to a Blob
 */
export const base64ToBlob = (base64: string, mimeType: string = 'application/octet-stream'): Blob => {
  // Convert base64 to binary
  const byteCharacters = atob(base64);
  const byteArrays = [];

  // Slice the binary into 1024-byte chunks
  for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
    const slice = byteCharacters.slice(offset, offset + 1024);
    
    // Convert to Uint8Array
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  
  // Create and return Blob from chunks
  return new Blob(byteArrays, { type: mimeType });
};

/**
 * Convert a Blob to base64 (returns Promise)
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Remove data URL prefix (e.g., "data:application/octet-stream;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
