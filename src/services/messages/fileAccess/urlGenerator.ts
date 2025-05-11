
import { getPublicFileUrl, getAuthenticatedFileUrl, getDirectPublicUrl } from "../fileAccessService";
import { AccessMethod, AccessMode } from "@/components/message/detail/attachment/types";
import { AccessMethodData } from "./types";
import { supabase } from "@/integrations/supabase/client";

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
   * Check if user is currently authenticated
   */
  private async isAuthenticated(): Promise<boolean> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      return !!sessionData.session?.access_token;
    } catch (error) {
      console.error("[FileAccess] Error checking authentication:", error);
      return false;
    }
  }
  
  /**
   * Get file URL using specified method
   */
  public async getAccessUrl(method: AccessMethod = 'signed', accessMode: AccessMode = 'view'): Promise<AccessMethodData> {
    try {
      console.log(`[FileAccess] Getting file access URL for: ${this.filePath} using method: ${method}, mode: ${accessMode}`);
      console.log(`[FileAccess] Delivery context - ID: ${this.deliveryId || 'none'}, Recipient: ${this.recipientEmail ? this.recipientEmail.substring(0, 3) + '...' : 'none'}`);
      
      if (!this.filePath) {
        throw new Error("File path is missing");
      }
      
      // Check if we're authenticated but don't have a delivery ID
      // This means we're accessing in the main app context
      const isUserAuthenticated = await this.isAuthenticated();
      const isDeliveryContext = !!(this.deliveryId && this.recipientEmail);
      const isAuthContext = isUserAuthenticated && !isDeliveryContext;
      
      console.log(`[FileAccess] Auth context: ${isAuthContext}, Delivery context: ${isDeliveryContext}`);

      // Direct URL method
      if (method === 'direct') {
        const directUrl = this.getDirectUrl();
        if (directUrl) {
          return { url: directUrl, method: 'direct' };
        }
        throw new Error("Could not generate direct URL");
      }
      
      // Signed URL method - preferred for authenticated users
      if (method === 'signed' || isAuthContext) {
        const url = await getAuthenticatedFileUrl(
          this.filePath, 
          false, 
          accessMode === 'download'
        );
        
        if (url) {
          console.log(`[FileAccess] Successfully generated signed URL`);
          return { url, method: 'signed' };
        }
        console.log(`[FileAccess] Failed to generate signed URL, falling back...`);
      }
      
      // Secure/edge function method - only available with delivery context
      if ((method === 'secure' || !isAuthContext) && isDeliveryContext) {
        try {
          const url = await getPublicFileUrl(
            this.filePath, 
            this.deliveryId!, 
            this.recipientEmail!, 
            accessMode
          );
          
          if (url) {
            console.log(`[FileAccess] Successfully generated secure URL via edge function`);
            return { url, method: 'secure' };
          }
        } catch (secureError) {
          console.error("[FileAccess] Error with secure method:", secureError);
          // Continue to fallback methods
        }
      }
      
      // Try fallback methods if requested method fails
      if (method !== 'signed') {
        console.log("[FileAccess] Trying signed URL as fallback");
        try {
          const signedUrl = await getAuthenticatedFileUrl(
            this.filePath, 
            true, // include fallback
            accessMode === 'download'
          );
          
          if (signedUrl) {
            console.log(`[FileAccess] Generated signed URL as fallback`);
            return { url: signedUrl, method: 'signed' };
          }
        } catch (signedError) {
          console.error("[FileAccess] Signed URL fallback failed:", signedError);
        }
      }
      
      // Last resort - direct URL
      console.log("[FileAccess] Trying direct URL as final fallback");
      const directUrl = this.getDirectUrl();
      if (directUrl) {
        console.log(`[FileAccess] Generated direct URL as final fallback`);
        return { url: directUrl, method: 'direct' };
      }
      
      console.error("[FileAccess] All URL generation methods failed");
      return { url: null, method: null };
    } catch (error) {
      console.error("[FileAccess] Error generating URL:", error);
      
      // Final fallback to direct URL even after exceptions
      const directUrl = this.getDirectUrl();
      if (directUrl) {
        console.log("[FileAccess] Using direct URL after exception");
        return { url: directUrl, method: 'direct' };
      }
      
      return { url: null, method: null };
    }
  }
}
