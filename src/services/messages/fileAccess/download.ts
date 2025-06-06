
import { toast } from "@/components/ui/use-toast";
import { AccessMethod } from "@/components/message/detail/attachment/types";
import { DownloadOptions } from "./types";
import { supabase } from "@/integrations/supabase/client";

/**
 * Handles file download execution and browser compatibility
 */
export class FileDownloader {
  /**
   * Check if browser supports the download attribute
   */
  public static browserSupportsDownload(): boolean {
    const a = document.createElement('a');
    return typeof a.download !== 'undefined';
  }
  
  /**
   * Create an anchor element for download or viewing
   * This returns a Promise<HTMLAnchorElement> to handle the async operations needed
   */
  public static async createAnchorElement(url: string, options: DownloadOptions): Promise<HTMLAnchorElement> {
    const { fileName, fileType, forDownload } = options;
    const a = document.createElement('a');
    
    // Add timestamp to prevent caching
    const timestamp = Date.now();
    let finalUrl = url;
    
    // Parse the URL to properly add parameters
    try {
      const parsedUrl = new URL(url);
      
      // Add timestamp for cache busting
      parsedUrl.searchParams.append('t', timestamp.toString());
      
      // Add download parameters using the correct format
      if (forDownload) {
        parsedUrl.searchParams.append('download-file', 'true');
        parsedUrl.searchParams.append('mode', 'download');
      }
      
      // Get the current session to extract the token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      // Always add auth token as a URL parameter if it's available
      // This is helpful when the edge function uses the service role key for authorization
      if (token) {
        console.log("[FileDownloader] Adding auth token to request");
        parsedUrl.searchParams.set('auth_token', token);
      } else {
        console.log("[FileDownloader] No auth token available - using public access");
      }
      
      finalUrl = parsedUrl.toString();
      console.log("[FileDownloader] Final URL:", finalUrl);
    } catch (error) {
      console.error("[FileDownloader] Error parsing URL:", error);
      // If URL parsing fails, fall back to simple string concat
      if (url.includes('?')) {
        finalUrl = `${url}&t=${timestamp}`;
        if (forDownload) {
          finalUrl += '&download-file=true&mode=download';
        }
        
        // Try to add the auth token
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (token) {
          finalUrl += `&auth_token=${token}`;
        }
      } else {
        finalUrl = `${url}?t=${timestamp}`;
        if (forDownload) {
          finalUrl += '&download-file=true&mode=download';
        }
        
        // Try to add the auth token
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (token) {
          finalUrl += `&auth_token=${token}`;
        }
      }
    }
    
    // Set href with enhanced cache busting
    a.href = finalUrl;
    
    // Set download attribute when forcing download
    if (forDownload) {
      a.download = fileName;
      a.setAttribute('download', fileName);
    }
    
    console.log(`[FileDownloader] ${forDownload ? 'Download' : 'View'} URL: ${a.href}`);
    
    a.setAttribute('type', fileType || 'application/octet-stream');
    return a;
  }
  
  /**
   * Execute download with appropriate notification
   */
  public static async executeDownload(url: string, fileName: string, fileType: string, method: AccessMethod): Promise<void> {
    console.log(`[FileDownloader] Starting download for ${fileName} using ${method} method`);
    console.log(`[FileDownloader] Download URL: ${url}`);
    
    // Create link with download attribute
    const downloadOptions = { fileName, fileType, forDownload: true };
    const a = await FileDownloader.createAnchorElement(url, downloadOptions);
    
    // Try multiple download strategies for browser compatibility
    try {
      // Add to body and click for better browser compatibility
      document.body.appendChild(a);
      a.style.display = 'none';
      
      // Give the browser a moment to register the download element
      setTimeout(() => {
        console.log("[FileDownloader] Clicking download link");
        a.click();
        
        // Short delay before removal to ensure download starts
        setTimeout(() => {
          document.body.removeChild(a);
          
          // Show a simple success notification
          toast({
            title: "Download started",
            description: `${fileName} is being downloaded.`,
          });
        }, 1000);
      }, 100);
    } catch (error) {
      console.error("[FileDownloader] Error during download execution:", error);
      
      // Try alternative download method
      try {
        console.log("[FileDownloader] Trying window.open fallback method");
        window.open(url, '_blank');
        
        toast({
          title: "Download initiated",
          description: "A new tab has been opened. If download doesn't start automatically, save the file manually.",
        });
      } catch (fallbackError) {
        console.error("[FileDownloader] Fallback method also failed:", fallbackError);
        
        toast({
          title: "Download failed",
          description: "Please right-click the download button and select 'Save link as...'",
          variant: "destructive"
        });
      }
    }
  }
  
  /**
   * Open file in a new tab
   */
  public static async openFile(url: string, fileName: string, fileType: string): Promise<void> {
    const viewOptions = { fileName, fileType, forDownload: false };
    const a = await FileDownloader.createAnchorElement(url, viewOptions);
    
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
    }, 200);
  }
}
