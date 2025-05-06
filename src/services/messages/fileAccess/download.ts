
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
    if (url.includes('?')) {
      a.href = `${url}&${cacheBuster}`;
    } else {
      a.href = `${url}?${cacheBuster}`;
    }
    
    // Force content-disposition by adding 'download' parameters
    if (forDownload) {
      if (FileDownloader.browserSupportsDownload()) {
        a.download = fileName;
        a.setAttribute('download', fileName);
      } else {
        // For browsers that don't support download attribute,
        // ensure the URL has a download parameter
        if (url.includes('?')) {
          a.href = `${url}&download=true&filename=${encodeURIComponent(fileName)}&${cacheBuster}`;
        } else {
          a.href = `${url}?download=true&filename=${encodeURIComponent(fileName)}&${cacheBuster}`;
        }
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
    // Create link with download attribute
    const downloadOptions = { fileName, fileType, forDownload: true };
    const a = FileDownloader.createAnchorElement(url, downloadOptions);
    
    // Append to body, click, then remove
    document.body.appendChild(a);
    a.click();
    
    // Short delay before removal to ensure download starts
    setTimeout(() => {
      document.body.removeChild(a);
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
    console.log(`Download URL: ${url}`);
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
    }, 100);
  }
}
