
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
    return getDirectPublicUrl(this.filePath);
  }
  
  /**
   * Get file URL using specified method
   */
  public async getAccessUrl(method: AccessMethod = 'secure', accessMode: AccessMode = 'view'): Promise<AccessMethodData> {
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
      }
      
      // If we're in public view mode with delivery ID and recipient email 
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
        
        if (!url) {
          throw new Error("Could not generate secure access URL");
        }
        
        return { url, method: 'secure' };
      } else if (method === 'signed') {
        // Default to the standard Supabase storage URL generation
        console.log("Using signed URL access");
        
        // Add download parameter for authenticated downloads
        const url = await getAuthenticatedFileUrl(
          this.filePath, 
          false, 
          accessMode === 'download'
        );
        
        console.log("Generated signed URL:", url);
        
        if (!url) {
          throw new Error("Could not generate signed URL");
        }
        
        return { url, method: 'signed' };
      }
      
      // Fallback to signed URL if not explicitly requesting direct
      if (method !== 'direct') {
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
      
      // Fallback to direct URL if all else fails
      const directUrl = this.getDirectUrl();
      if (directUrl) {
        console.log("Falling back to direct URL access");
        return { url: directUrl, method: 'direct' };
      }
      
      throw new Error("No suitable access method found for this file");
    } catch (error) {
      console.error("Error generating URL:", error);
      
      // If secure method fails, try signed URL as fallback
      if (method === 'secure') {
        console.log("Secure access failed, trying signed URL");
        try {
          const signedUrl = await getAuthenticatedFileUrl(this.filePath, true, accessMode === 'download');
          if (signedUrl) {
            return { url: signedUrl, method: 'signed' };
          }
        } catch (fallbackError) {
          console.error("Signed URL fallback also failed:", fallbackError);
        }
        
        // If signed URL also fails, try direct as last resort
        const directUrl = this.getDirectUrl();
        if (directUrl) {
          console.log("Secure and signed access failed, falling back to direct URL");
          return { url: directUrl, method: 'direct' };
        }
      }
      
      return { url: null, method: null };
    }
  }
}
