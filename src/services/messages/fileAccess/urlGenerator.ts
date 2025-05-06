
import { getPublicFileUrl, getAuthenticatedFileUrl, getDirectPublicUrl } from "../fileAccessService";
import { AccessMethod, AccessMode } from "@/components/message/detail/attachment/types";
import { AccessMethodData } from "./types";

/**
 * Generates URLs for accessing files using different methods
 */
export class FileUrlGenerator {
  private filePath: string;
  private deliveryId?: string;
  private recipientEmail?: string;
  
  constructor(filePath: string, deliveryId?: string, recipientEmail?: string) {
    this.filePath = filePath;
    this.deliveryId = deliveryId;
    this.recipientEmail = recipientEmail;
  }
  
  /**
   * Get direct public URL for the file
   */
  public getDirectUrl(): string | null {
    try {
      const directUrl = getDirectPublicUrl(this.filePath);
      if (!directUrl) {
        console.error(`[FileAccess] Unable to generate direct URL for ${this.filePath}`);
        return null;
      }
      return directUrl;
    } catch (error) {
      console.error(`[FileAccess] Error in getDirectUrl:`, error);
      return null;
    }
  }
  
  /**
   * Get file URL using specified method
   */
  public async getAccessUrl(method: AccessMethod = 'signed', accessMode: AccessMode = 'view'): Promise<AccessMethodData> {
    try {
      console.log(`Getting file access URL for: ${this.filePath} using method: ${method}, mode: ${accessMode}`);
      
      if (!this.filePath) {
        throw new Error("File path is missing");
      }

      // For direct access, return the direct URL immediately
      if (method === 'direct') {
        const directUrl = this.getDirectUrl();
        if (directUrl) {
          console.log("Using direct public URL access");
          return { url: directUrl, method: 'direct' };
        }
        throw new Error("Could not generate direct URL");
      }
      
      // Prefer signed URL method
      if (method === 'signed') {
        // Default to the standard Supabase storage URL generation
        console.log("Using signed URL access");
        
        // Add download parameter for authenticated downloads
        const url = await getAuthenticatedFileUrl(
          this.filePath, 
          false, 
          accessMode === 'download'
        );
        
        console.log("Generated signed URL:", url);
        
        if (url) {
          return { url, method: 'signed' };
        }
        // If signed URL fails, fall through to other methods
      }
      
      // Only use secure/edge function if explicitly requested and delivery params exist
      if (method === 'secure' && this.deliveryId && this.recipientEmail) {
        console.log(`Using secure public access with deliveryId: ${this.deliveryId}, recipient: ${this.recipientEmail}`);
        
        // Add download=true parameter for file downloads
        const url = await getPublicFileUrl(
          this.filePath, 
          this.deliveryId, 
          this.recipientEmail, 
          accessMode
        );
        
        console.log("Generated secure public URL:", url);
        
        if (url) {
          return { url, method: 'secure' };
        }
      }
      
      // If requested method fails or isn't available, try other methods in order of preference
      // First try signed if we weren't already using it
      if (method !== 'signed') {
        const signedResult = await getAuthenticatedFileUrl(
          this.filePath, 
          false, 
          accessMode === 'download'
        );
        
        if (signedResult) {
          console.log("Falling back to signed URL access");
          return { url: signedResult, method: 'signed' };
        }
      }
      
      // Then try secure if we have the credentials and weren't already using it
      if (method !== 'secure' && this.deliveryId && this.recipientEmail) {
        const secureUrl = await getPublicFileUrl(
          this.filePath,
          this.deliveryId,
          this.recipientEmail,
          accessMode
        );
        
        if (secureUrl) {
          console.log("Falling back to secure URL access");
          return { url: secureUrl, method: 'secure' };
        }
      }
      
      // Finally try direct URL if all else fails
      const directUrl = this.getDirectUrl();
      if (directUrl) {
        console.log("Falling back to direct URL access");
        return { url: directUrl, method: 'direct' };
      }
      
      throw new Error("No suitable access method found for this file");
    } catch (error) {
      console.error("Error generating URL:", error);
      
      // Try alternatives if the primary method fails
      if (method === 'signed') {
        // Try secure method if delivery params exist
        if (this.deliveryId && this.recipientEmail) {
          try {
            const secureUrl = await getPublicFileUrl(this.filePath, this.deliveryId, this.recipientEmail, accessMode);
            if (secureUrl) {
              return { url: secureUrl, method: 'secure' };
            }
          } catch (secureError) {
            console.error("Secure URL fallback failed:", secureError);
          }
        }
        
        // If secure fails or isn't available, try direct
        const directUrl = this.getDirectUrl();
        if (directUrl) {
          return { url: directUrl, method: 'direct' };
        }
      } else if (method === 'secure') {
        // Try signed URL if secure method fails
        try {
          const signedUrl = await getAuthenticatedFileUrl(this.filePath, true, accessMode === 'download');
          if (signedUrl) {
            return { url: signedUrl, method: 'signed' };
          }
        } catch (fallbackError) {
          console.error("Signed URL fallback also failed:", fallbackError);
        }
        
        // Try direct as last resort
        const directUrl = this.getDirectUrl();
        if (directUrl) {
          return { url: directUrl, method: 'direct' };
        }
      }
      
      return { url: null, method: null };
    }
  }
}
