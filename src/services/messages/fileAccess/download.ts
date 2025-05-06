
import { toast } from "@/components/ui/use-toast";
import { AccessMethod } from "@/components/message/detail/attachment/types";
import { DownloadOptions } from "./types";

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
   */
  public static createAnchorElement(url: string, options: DownloadOptions): HTMLAnchorElement {
    const { fileName, fileType, forDownload } = options;
    const a = document.createElement('a');
    
    // Add timestamp to prevent caching
    const timestamp = Date.now();
    let finalUrl = url;
    if (url.includes('?')) {
      finalUrl = `${url}&_t=${timestamp}`;
    } else {
      finalUrl = `${url}?_t=${timestamp}`;
    }
    
    // Set href with enhanced cache busting
    a.href = finalUrl;
    
    // Always force download - simplified approach
    a.download = fileName;
    a.setAttribute('download', fileName);
    
    // Add additional download parameters to help Edge Function
    if (finalUrl.includes('?')) {
      a.href = `${finalUrl}&download=true&mode=download&forceDownload=true`;
    } else {
      a.href = `${finalUrl}?download=true&mode=download&forceDownload=true`;
    }
    
    console.log(`[FileDownloader] Download URL: ${a.href}`);
    
    a.setAttribute('type', fileType || 'application/octet-stream');
    return a;
  }
  
  /**
   * Execute download with appropriate notification
   */
  public static executeDownload(url: string, fileName: string, fileType: string, method: AccessMethod): void {
    console.log(`[FileDownloader] Starting download for ${fileName} using ${method} method`);
    console.log(`[FileDownloader] Download URL: ${url}`);
    
    // Create link with download attribute
    const downloadOptions = { fileName, fileType, forDownload: true };
    const a = FileDownloader.createAnchorElement(url, downloadOptions);
    
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
  public static openFile(url: string, fileName: string, fileType: string): void {
    const viewOptions = { fileName, fileType, forDownload: false };
    const a = FileDownloader.createAnchorElement(url, viewOptions);
    
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
    }, 200);
  }
}
