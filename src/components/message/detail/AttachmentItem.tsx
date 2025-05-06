
import React, { useState } from "react";
import { FileIcon, Download, ExternalLink, AlertCircle, RefreshCw, Link, Bug, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/use-toast";
import { HOVER_TRANSITION, BUTTON_HOVER_EFFECTS } from "@/utils/hoverEffects";
import { getPublicFileUrl, getAuthenticatedFileUrl, getDirectPublicUrl } from "@/services/messages/fileAccessService";
import { Badge } from "@/components/ui/badge";

interface AttachmentItemProps {
  attachment: {
    name: string;
    size: number;
    type: string;
    path: string;
  };
  deliveryId?: string;
  recipientEmail?: string;
}

export function AttachmentItem({ attachment, deliveryId, recipientEmail }: AttachmentItemProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  const [accessUrl, setAccessUrl] = useState<string | null>(null);
  const [downloadMethod, setDownloadMethod] = useState<'secure' | 'direct'>('secure');
  const [lastSuccessMethod, setLastSuccessMethod] = useState<'secure' | 'direct' | null>(null);

  // Get direct public URL (for direct access option)
  const directUrl = getDirectPublicUrl(attachment.path);

  const getFileAccessUrl = async (method: 'secure' | 'direct' = 'secure') => {
    try {
      setHasError(false);
      console.log(`Getting file access URL for: ${attachment.path} using method: ${method}`);
      
      if (!attachment.path) {
        throw new Error("File path is missing");
      }

      // For direct access, return the direct URL immediately
      if (method === 'direct' && directUrl) {
        console.log("Using direct public URL access");
        setAccessUrl(directUrl);
        setLastSuccessMethod('direct');
        return directUrl;
      }
      
      // If we're in public view mode with delivery ID and recipient email 
      if (method === 'secure' && deliveryId && recipientEmail) {
        console.log(`Using secure public access with deliveryId: ${deliveryId}, recipient: ${recipientEmail}`);
        const url = await getPublicFileUrl(attachment.path, deliveryId, recipientEmail);
        console.log("Generated secure public URL:", url);
        setAccessUrl(url);
        
        if (!url) {
          throw new Error("Could not generate secure access URL");
        }
        
        setLastSuccessMethod('secure');
        return url;
      } else if (method === 'secure') {
        // Default to the standard Supabase storage URL generation for authenticated users
        console.log("Using authenticated access");
        const url = await getAuthenticatedFileUrl(attachment.path);
        console.log("Generated authenticated URL:", url);
        setAccessUrl(url);
        
        if (!url) {
          throw new Error("Could not generate authenticated access URL");
        }
        
        setLastSuccessMethod('secure');
        return url;
      }
      
      // Fallback to direct URL if all else fails
      if (directUrl) {
        console.log("Falling back to direct URL access");
        setAccessUrl(directUrl);
        setLastSuccessMethod('direct');
        return directUrl;
      }
      
      throw new Error("No suitable access method found for this file");
    } catch (error) {
      console.error("Error generating URL:", error);
      setHasError(true);
      
      // If secure method fails, try direct as fallback
      if (method === 'secure' && directUrl) {
        console.log("Secure access failed, automatically falling back to direct URL");
        setDownloadMethod('direct');
        return directUrl;
      }
      
      return null;
    }
  };

  const retryAccess = async () => {
    setIsLoading(true);
    setRetryCount(prev => prev + 1);
    
    try {
      // Try the opposite of the current method first as a retry strategy
      const methodToTry = downloadMethod === 'secure' ? 'direct' : 'secure';
      const url = await getFileAccessUrl(methodToTry);
      
      if (url) {
        setHasError(false);
        setDownloadMethod(methodToTry);
        toast({
          title: "Retry successful",
          description: `Access restored using ${methodToTry === 'secure' ? 'secure' : 'direct'} method`,
        });
      } else {
        // If the opposite method failed, try the current method again
        const fallbackUrl = await getFileAccessUrl(downloadMethod);
        if (fallbackUrl) {
          setHasError(false);
          toast({
            title: "Retry successful",
            description: "Access to the file has been restored",
          });
        } else {
          toast({
            title: "Retry failed",
            description: "Still unable to access the file. Try the direct link option.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error("Error retrying file access:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDownloadMethod = () => {
    setDownloadMethod(prev => prev === 'secure' ? 'direct' : 'secure');
    toast({
      title: `Switched to ${downloadMethod === 'secure' ? 'direct' : 'secure'} download`,
      description: `Now using ${downloadMethod === 'secure' ? 'direct' : 'secure'} method for file access`,
    });
  };

  const downloadFile = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      const url = await getFileAccessUrl(downloadMethod);
      
      if (url) {
        // Create an invisible anchor element and trigger the download
        // Removed target="_blank" to ensure download works properly
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.name; // Set the download attribute with the filename
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        toast({
          title: "Download started",
          description: `${attachment.name} is being downloaded using ${downloadMethod} access`,
        });
      } else {
        // Try the alternative method if the primary method fails
        const alternativeMethod = downloadMethod === 'secure' ? 'direct' : 'secure';
        const alternativeUrl = await getFileAccessUrl(alternativeMethod);
        
        if (alternativeUrl) {
          setDownloadMethod(alternativeMethod);
          const a = document.createElement('a');
          a.href = alternativeUrl;
          a.download = attachment.name; // Set the download attribute with the filename
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          toast({
            title: "Download started (alternative method)",
            description: `Automatically switched to ${alternativeMethod} access`,
          });
        } else {
          toast({
            title: "Download Error",
            description: "Could not access the file using either method. Please try again or contact support.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error("Error downloading attachment:", error);
      toast({
        title: "Error",
        description: "An error occurred while trying to access the attachment",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openFile = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      const url = await getFileAccessUrl(downloadMethod);
      
      if (url) {
        // For opening in a new tab, we want to use target="_blank"
        window.open(url, '_blank');
      } else {
        // Try the alternative method if the primary method fails
        const alternativeMethod = downloadMethod === 'secure' ? 'direct' : 'secure';
        const alternativeUrl = await getFileAccessUrl(alternativeMethod);
        
        if (alternativeUrl) {
          setDownloadMethod(alternativeMethod);
          window.open(alternativeUrl, '_blank');
          
          toast({
            title: "Using alternative method",
            description: `Automatically switched to ${alternativeMethod} access`,
          });
        } else {
          toast({
            title: "Access Error",
            description: "Could not access the file using either method. Please try again or contact support.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error("Error opening attachment:", error);
      toast({
        title: "Error",
        description: "An error occurred while trying to access the attachment",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    else return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  // Test function to try direct URL access
  const tryDirectAccess = () => {
    if (directUrl) {
      window.open(directUrl, '_blank');
      setDownloadMethod('direct');
      setLastSuccessMethod('direct');
      toast({
        title: "Direct URL Test",
        description: "Opening direct URL without security checks"
      });
    } else {
      toast({
        title: "Error",
        description: "Could not generate direct URL",
        variant: "destructive"
      });
    }
  };
  
  const toggleDebug = () => {
    setShowDebug(prev => !prev);
  };
  
  return (
    <div className={`border rounded-md p-3 transition-all duration-200 hover:shadow-md ${hasError ? 'border-red-300 bg-red-50' : 'hover:border-primary/20'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 overflow-hidden">
          {hasError ? (
            <AlertCircle className={`h-4 w-4 text-red-500 flex-shrink-0 ${HOVER_TRANSITION}`} />
          ) : (
            <FileIcon className={`h-4 w-4 flex-shrink-0 ${HOVER_TRANSITION}`} />
          )}
          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="block truncate">{attachment.name}</span>
              <Badge 
                variant={downloadMethod === 'secure' ? "outline" : "secondary"} 
                className="text-xs py-0 h-5"
              >
                {downloadMethod === 'secure' ? 'Secure' : 'Direct'}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {/* Toggle download method */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={downloadMethod === 'secure' ? "outline" : "secondary"}
                  size="sm" 
                  onClick={toggleDownloadMethod}
                  disabled={isLoading}
                  className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
                >
                  {downloadMethod === 'secure' ? (
                    <Check className={`h-4 w-4 ${HOVER_TRANSITION}`} />
                  ) : (
                    <Link className={`h-4 w-4 ${HOVER_TRANSITION}`} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Switch to {downloadMethod === 'secure' ? 'direct' : 'secure'} access</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Debug toggle */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={toggleDebug}
                  className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
                >
                  <Bug className={`h-4 w-4 ${HOVER_TRANSITION}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle debug info</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Direct access button (always available) */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={tryDirectAccess}
                  className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default} bg-amber-100 hover:bg-amber-200`}
                >
                  <Link className={`h-4 w-4 ${HOVER_TRANSITION}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Use direct URL</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {hasError ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={retryAccess}
                    disabled={isLoading}
                    className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''} ${HOVER_TRANSITION}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Retry access</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={downloadFile}
                    disabled={isLoading}
                    className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
                  >
                    <Download className={`h-4 w-4 ${isLoading ? 'animate-pulse' : ''} ${HOVER_TRANSITION}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download file</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={hasError ? retryAccess : openFile}
                  disabled={isLoading}
                  className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
                >
                  {hasError ? (
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''} ${HOVER_TRANSITION}`} />
                  ) : (
                    <ExternalLink className={`h-4 w-4 ${isLoading ? 'animate-pulse' : ''} ${HOVER_TRANSITION}`} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{hasError ? 'Retry access' : 'Open in new tab'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {hasError && (
        <div className="mt-2 text-xs text-red-600">
          There was an error accessing this file. Please try the direct URL option or contact the sender.
          {retryCount > 0 && (
            <span className="block mt-1">
              Retried {retryCount} time{retryCount !== 1 ? 's' : ''} without success.
            </span>
          )}
        </div>
      )}

      {(showDebug || hasError) && (
        <div className="mt-2 text-xs text-gray-500 border-t pt-2">
          <div className="font-semibold mb-1">Debug Information:</div>
          <div>Path: {attachment.path}</div>
          <div>Current mode: {downloadMethod === 'secure' ? 'Secure access (edge function)' : 'Direct public URL'}</div>
          <div>Last successful method: {lastSuccessMethod || 'none'}</div>
          {accessUrl && <div className="truncate">Last generated URL: {accessUrl}</div>}
          {directUrl && <div className="truncate">Direct URL: {directUrl}</div>}
          <div className="mt-1">
            <span className="font-semibold">Delivery ID:</span> {deliveryId || "(none)"}
          </div>
          <div>
            <span className="font-semibold">Recipient:</span> {recipientEmail || "(none)"}
          </div>
        </div>
      )}
    </div>
  );
}
