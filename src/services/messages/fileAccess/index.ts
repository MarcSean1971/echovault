
import { toast } from "@/components/ui/use-toast";
import { FileUrlGenerator } from "./urlGenerator";
import { FileDownloader } from "./download";
import { AccessMethod, AccessMode } from "@/components/message/detail/attachment/types";
import { AccessMethodData } from "./types";

/**
 * File access manager that handles different access methods
 */
export class FileAccessManager {
  private urlGenerator: FileUrlGenerator;
  
  constructor(filePath: string, deliveryId?: string, recipientEmail?: string) {
    this.urlGenerator = new FileUrlGenerator(filePath, deliveryId, recipientEmail);
  }
  
  /**
   * Get direct public URL for the file
   */
  public getDirectUrl(): string | null {
    return this.urlGenerator.getDirectUrl();
  }
  
  /**
   * Get file URL using specified method
   */
  public async getAccessUrl(method: AccessMethod = 'secure', accessMode: AccessMode = 'view'): Promise<AccessMethodData> {
    return this.urlGenerator.getAccessUrl(method, accessMode);
  }
  
  /**
   * Execute download with appropriate notification
   */
  public static executeDownload(url: string, fileName: string, fileType: string, method: AccessMethod): void {
    FileDownloader.executeDownload(url, fileName, fileType, method);
  }
  
  /**
   * Create an anchor element for download or viewing
   * Note: This is now a wrapper around FileDownloader.createAnchorElement that handles the Promise
   */
  public static async createAnchorElement(url: string, fileName: string, fileType: string, forDownload: boolean): Promise<HTMLAnchorElement> {
    return FileDownloader.createAnchorElement(url, { fileName, fileType, forDownload });
  }
  
  /**
   * Check if browser supports the download attribute
   */
  public static browserSupportsDownload(): boolean {
    return FileDownloader.browserSupportsDownload();
  }
}

// Re-export for easier importing
export * from "./types";
