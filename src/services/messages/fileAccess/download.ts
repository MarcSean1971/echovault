
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
    
    // Add cache-busting parameter
    const cacheBuster = `_t=${Date.now()}`;
    let finalUrl = url;
    if (url.includes('?')) {
      finalUrl = `${url}&${cacheBuster}`;
    } else {
      finalUrl = `${url}?${cacheBuster}`;
    }
    
    // Set href with enhanced cache busting
    a.href = finalUrl;
    
    // Force content-disposition by adding 'download' parameters
    if (forDownload) {
      if (FileDownloader.browserSupportsDownload()) {
        a.download = fileName;
        a.setAttribute('download', fileName);
        
        // For secure/signed URLs, ensure download parameters are included
        if (url.includes('mode=') || url.includes('download=')) {
          // URL already has download parameters
          console.log(`Using existing download parameters in URL: ${finalUrl}`);
        } else if (finalUrl.includes('?')) {
          finalUrl = `${finalUrl}&download=true&mode=download`;
          a.href = finalUrl;
        } else {
          finalUrl = `${finalUrl}?download=true&mode=download`;
          a.href = finalUrl;
        }
        
        console.log(`Enhanced download URL: ${finalUrl}`);
      } else {
        // For browsers that don't support download attribute,
        // ensure the URL has a download parameter
        if (finalUrl.includes('?')) {
          a.href = `${finalUrl}&download=true&mode=download&filename=${encodeURIComponent(fileName)}`;
        } else {
          a.href = `${finalUrl}?download=true&mode=download&filename=${encodeURIComponent(fileName)}`;
        }
        console.log(`Fallback download URL for unsupported browser: ${a.href}`);
      }
    } else {
      a.target = '_blank';
    }
    
    a.setAttribute('type', fileType || 'application/octet-stream');
    
    return a;
  }
  
  /**
   * Execute download with appropriate notification
   */
  public static executeDownload(url: string, fileName: string, fileType: string, method: AccessMethod): void {
    console.log(`Starting download execution for ${fileName} using ${method} method`);
    console.log(`Download URL: ${url}`);
    
    // Create link with download attribute
    const downloadOptions = { fileName, fileType, forDownload: true };
    const a = FileDownloader.createAnchorElement(url, downloadOptions);
    
    // Log the final URL for debugging
    console.log(`Final download URL: ${a.href}`);
    console.log(`Download attribute: ${a.hasAttribute('download') ? a.getAttribute('download') : 'not set'}`);
    
    // Append to body, click, then remove
    document.body.appendChild(a);
    
    // Add a delay before clicking to ensure the DOM has time to update
    setTimeout(() => {
      console.log("Clicking download link");
      a.click();
      
      // Short delay before removal to ensure download starts
      setTimeout(() => {
        document.body.removeChild(a);
      }, 300);
    }, 100);
    
    // Show success notification
    const methodName = method === 'secure' ? 'Edge Function' : 
                      method === 'signed' ? 'Signed URL' : 'Direct URL';
    
    toast({
      title: "Download started",
      description: `${fileName} is being downloaded using ${methodName}`,
    });
    
    // Log for debugging
    console.log(`Download initiated: ${fileName} using ${methodName}`);
  }
  
  /**
   * Open file in a new tab
   */
  public static openFile(url: string, fileName: string, fileType: string): void {
    const viewOptions = { fileName, fileType, forDownload: false };
    const a = FileDownloader.createAnchorElement(url, viewOptions);
    
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
    }, 200);
  }
}
