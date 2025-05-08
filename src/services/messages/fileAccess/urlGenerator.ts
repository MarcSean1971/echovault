
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

      // Direct URL method
      if (method === 'direct') {
        const directUrl = this.getDirectUrl();
        if (directUrl) {
          return { url: directUrl, method: 'direct' };
        }
        throw new Error("Could not generate direct URL");
      }
      
      // Signed URL method
      if (method === 'signed') {
        const url = await getAuthenticatedFileUrl(
          this.filePath, 
          false, 
          accessMode === 'download'
        );
        
        if (url) {
          return { url, method: 'signed' };
        }
      }
      
      // Secure/edge function method
      if (method === 'secure' && this.deliveryId && this.recipientEmail) {
        const url = await getPublicFileUrl(
          this.filePath, 
          this.deliveryId, 
          this.recipientEmail, 
          accessMode
        );
        
        if (url) {
          return { url, method: 'secure' };
        }
      }
      
      // Try fallback methods if requested method fails
      if (method !== 'signed') {
        const signedUrl = await getAuthenticatedFileUrl(
          this.filePath, 
          false, 
          accessMode === 'download'
        );
        
        if (signedUrl) {
          return { url: signedUrl, method: 'signed' };
        }
      }
      
      // Last resort - direct URL
      const directUrl = this.getDirectUrl();
      if (directUrl) {
        return { url: directUrl, method: 'direct' };
      }
      
      return { url: null, method: null };
    } catch (error) {
      console.error("Error generating URL:", error);
      return { url: null, method: null };
    }
  }
}
