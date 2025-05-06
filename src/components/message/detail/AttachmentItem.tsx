import React, { useState, useEffect } from "react";
import { FileIcon, Download, ExternalLink, AlertCircle, RefreshCw, Link, Bug, Check, Shield, FileCheck } from "lucide-react";
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

// Define specific types for access methods
type AccessMethod = 'secure' | 'signed' | 'direct';
type AccessMode = 'download' | 'view';

export function AttachmentItem({ attachment, deliveryId, recipientEmail }: AttachmentItemProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  const [accessUrl, setAccessUrl] = useState<string | null>(null);
  const [downloadMethod, setDownloadMethod] = useState<AccessMethod>('secure');
  const [lastSuccessMethod, setLastSuccessMethod] = useState<AccessMethod | null>(null);
  const [downloadActive, setDownloadActive] = useState(false);

  // Get direct public URL (for direct access option)
  const directUrl = getDirectPublicUrl(attachment.path);

  useEffect(() => {
    // Reset download active state after a short period
    if (downloadActive) {
      const timer = setTimeout(() => {
        setDownloadActive(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [downloadActive]);

  // Function to get appropriate badge variant based on access method
  const getBadgeVariant = (method: AccessMethod) => {
    switch (method) {
      case 'secure':
        return "default"; // Green for secure (edge function)
      case 'signed':
        return "secondary"; // Grey for signed URL
      case 'direct':
        return "destructive"; // Red for direct (less secure)
      default:
        return "outline";
    }
  };

  // Function to get friendly name for access method
  const getMethodName = (method: AccessMethod) => {
    switch (method) {
      case 'secure':
        return "Edge Function";
      case 'signed':
        return "Signed URL";
      case 'direct':
        return "Direct URL";
      default:
        return "Unknown";
    }
  };

  const getFileAccessUrl = async (method: AccessMethod = 'secure', accessMode: AccessMode = 'view') => {
    try {
      setHasError(false);
      console.log(`Getting file access URL for: ${attachment.path} using method: ${method}, forDownload: ${accessMode === 'download'}`);
      
      if (!attachment.path) {
        throw new Error("File path is missing");
      }

      // For direct access, return the direct URL immediately
      if (method === 'direct' && directUrl) {
        console.log("Using direct public URL access");
        setAccessUrl(directUrl);
        setLastSuccessMethod('direct');
        setDownloadMethod('direct');
        return { url: directUrl, method: 'direct' as AccessMethod };
      }
      
      // If we're in public view mode with delivery ID and recipient email 
      if (method === 'secure' && deliveryId && recipientEmail) {
        console.log(`Using secure public access with deliveryId: ${deliveryId}, recipient: ${recipientEmail}`);
        
        // Add download=true parameter for file downloads
        const url = await getPublicFileUrl(
          attachment.path, 
          deliveryId, 
          recipientEmail, 
          accessMode
        );
        
        console.log("Generated secure public URL:", url);
        setAccessUrl(url);
        
        if (!url) {
          throw new Error("Could not generate secure access URL");
        }
        
        setLastSuccessMethod('secure');
        setDownloadMethod('secure');
        return { url, method: 'secure' as AccessMethod };
      } else if (method === 'signed') {
        // Default to the standard Supabase storage URL generation
        console.log("Using signed URL access");
        
        // Add download parameter for authenticated downloads
        const url = await getAuthenticatedFileUrl(
          attachment.path, 
          false, 
          accessMode === 'download'
        );
        
        console.log("Generated signed URL:", url);
        setAccessUrl(url);
        
        if (!url) {
          throw new Error("Could not generate signed URL");
        }
        
        setLastSuccessMethod('signed');
        setDownloadMethod('signed');
        return { url, method: 'signed' as AccessMethod };
      }
      
      // Fallback to signed URL if not explicitly requesting direct
      if (method !== 'direct') {
        const signedResult = await getAuthenticatedFileUrl(
          attachment.path, 
          false, 
          accessMode === 'download'
        );
        
        if (signedResult) {
          console.log("Falling back to signed URL access");
          setAccessUrl(signedResult);
          setLastSuccessMethod('signed');
          setDownloadMethod('signed');
          return { url: signedResult, method: 'signed' as AccessMethod };
        }
      }
      
      // Fallback to direct URL if all else fails
      if (directUrl) {
        console.log("Falling back to direct URL access");
        setAccessUrl(directUrl);
        setLastSuccessMethod('direct');
        setDownloadMethod('direct');
        return { url: directUrl, method: 'direct' as AccessMethod };
      }
      
      throw new Error("No suitable access method found for this file");
    } catch (error) {
      console.error("Error generating URL:", error);
      setHasError(true);
      
      // If secure method fails, try signed URL as fallback
      if (method === 'secure') {
        console.log("Secure access failed, trying signed URL");
        try {
          const signedUrl = await getAuthenticatedFileUrl(attachment.path, true, accessMode === 'download');
          if (signedUrl) {
            setDownloadMethod('signed');
            setLastSuccessMethod('signed');
            setAccessUrl(signedUrl);
            return { url: signedUrl, method: 'signed' as AccessMethod };
          }
        } catch (fallbackError) {
          console.error("Signed URL fallback also failed:", fallbackError);
        }
        
        // If signed URL also fails, try direct as last resort
        if (directUrl) {
          console.log("Secure and signed access failed, falling back to direct URL");
          setDownloadMethod('direct');
          setLastSuccessMethod('direct');
          return { url: directUrl, method: 'direct' as AccessMethod };
        }
      }
      
      return { url: null, method: null };
    }
  };

  const retryAccess = async () => {
    setIsLoading(true);
    setRetryCount(prev => prev + 1);
    
    try {
      // Define an array of methods to try, explicitly typed as AccessMethod[]
      const methodsToTry: AccessMethod[] = ['secure', 'signed', 'direct'];
      
      // Reorder to try methods in different order
      const currentIndex = methodsToTry.indexOf(downloadMethod);
      if (currentIndex !== -1) {
        methodsToTry.splice(currentIndex, 1);
        methodsToTry.unshift(downloadMethod);
      }
      
      let succeeded = false;
      
      for (const methodToTry of methodsToTry) {
        if (succeeded) break;
        
        try {
          const { url, method } = await getFileAccessUrl(methodToTry);
          
          if (url && method) {
            setHasError(false);
            setDownloadMethod(method);
            
            toast({
              title: "Retry successful",
              description: `Access restored using ${getMethodName(method)}`,
            });
            
            succeeded = true;
            break;
          }
        } catch (methodError) {
          console.error(`Error trying ${methodToTry} method:`, methodError);
        }
      }
      
      if (!succeeded) {
        toast({
          title: "Retry failed",
          description: "Unable to access the file using any method. Please try again later.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error retrying file access:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDownloadMethod = () => {
    // Cycle through the methods: secure -> signed -> direct -> secure
    const methods: AccessMethod[] = ['secure', 'signed', 'direct'];
    const currentIndex = methods.indexOf(downloadMethod);
    const nextMethod = methods[(currentIndex + 1) % methods.length];
    
    setDownloadMethod(nextMethod);
    toast({
      title: `Switched to ${getMethodName(nextMethod)}`,
      description: `Now using ${getMethodName(nextMethod)} for file access`,
    });
  };

  const downloadFile = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      setDownloadActive(true);
      console.log("Starting file download with method:", downloadMethod);
      
      // IMPORTANT: Explicitly use Edge Function with download mode for secure downloads
      if (downloadMethod === 'secure' && deliveryId && recipientEmail) {
        console.log("Using edge function with explicit download mode");
        
        // Get URL with download flag set to true
        const url = await getPublicFileUrl(
          attachment.path, 
          deliveryId, 
          recipientEmail, 
          'download' // Use download mode
        );
        
        if (url) {
          console.log("Download URL obtained from edge function:", url);
          
          // Handle download with proper attributes
          const a = document.createElement('a');
          a.href = url;
          a.download = attachment.name;
          a.setAttribute('download', attachment.name);
          a.setAttribute('type', attachment.type || 'application/octet-stream');
          
          // Add cache-busting parameter
          if (url.includes('?')) {
            a.href = `${url}&_t=${Date.now()}`;
          } else {
            a.href = `${url}?_t=${Date.now()}`;
          }
          
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          toast({
            title: "Download started",
            description: `${attachment.name} is being downloaded using Edge Function`,
          });
          
          setLastSuccessMethod('secure');
          return;
        }
      }
      
      // For non-secure methods, try to get a URL with download flag
      let result;
      if (downloadMethod === 'signed') {
        result = await getAuthenticatedFileUrl(attachment.path, false, true);
      } else {
        result = directUrl;
      }
      
      if (result) {
        console.log(`Download URL obtained using ${downloadMethod} method:`, result);
        
        // Create an anchor tag for download
        const a = document.createElement('a');
        a.href = result;
        a.download = attachment.name;
        a.setAttribute('download', attachment.name);
        a.setAttribute('type', attachment.type || 'application/octet-stream');
        
        // Add cache-busting parameter
        if (result.includes('?')) {
          a.href = `${result}&_t=${Date.now()}`;
        } else {
          a.href = `${result}?_t=${Date.now()}`;
        }
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        toast({
          title: "Download started",
          description: `${attachment.name} is being downloaded using ${getMethodName(downloadMethod)}`,
        });
        
        setLastSuccessMethod(downloadMethod);
        return;
      }
      
      // If current method fails, try alternatives in order of security
      // Explicitly type as AccessMethod[] to fix the error
      const fallbackMethods: AccessMethod[] = ['secure', 'signed', 'direct'].filter(m => m !== downloadMethod);
      
      for (const method of fallbackMethods) {
        try {
          let fallbackUrl = null;
          
          if (method === 'secure' && deliveryId && recipientEmail) {
            fallbackUrl = await getPublicFileUrl(
              attachment.path, 
              deliveryId, 
              recipientEmail, 
              'download'
            );
          } else if (method === 'signed') {
            fallbackUrl = await getAuthenticatedFileUrl(attachment.path, true, true);
          } else if (method === 'direct') {
            fallbackUrl = directUrl;
          }
          
          if (fallbackUrl) {
            console.log(`Fallback download URL obtained using ${method}:`, fallbackUrl);
            
            const a = document.createElement('a');
            a.href = fallbackUrl;
            a.download = attachment.name;
            a.setAttribute('download', attachment.name);
            a.setAttribute('type', attachment.type || 'application/octet-stream');
            
            // Add timestamp to break cache
            if (fallbackUrl.includes('?')) {
              a.href = `${fallbackUrl}&_t=${Date.now()}`;
            } else {
              a.href = `${fallbackUrl}?_t=${Date.now()}`;
            }
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            toast({
              title: "Download started with fallback method",
              description: `Using ${getMethodName(method)} after ${getMethodName(downloadMethod)} failed`,
            });
            
            setDownloadMethod(method);
            setLastSuccessMethod(method);
            return;
          }
        } catch (fallbackError) {
          console.error(`Error with fallback method ${method}:`, fallbackError);
        }
      }
      
      toast({
        title: "Download Error",
        description: "Could not access the file using any method. Please try again or contact support.",
        variant: "destructive"
      });
    } catch (error) {
      console.error("Error downloading attachment:", error);
      toast({
        title: "Error",
        description: "An error occurred while trying to download the attachment",
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
      const { url, method } = await getFileAccessUrl(downloadMethod);
      
      if (url) {
        // For opening in a new tab
        window.open(url, '_blank');
        if (method) {
          setLastSuccessMethod(method);
        }
        return;
      }
      
      // Try alternatives if current method fails
      const alternativeMethods: AccessMethod[] = ['secure', 'signed', 'direct'].filter(m => m !== downloadMethod);
      
      for (const alternativeMethod of alternativeMethods) {
        try {
          const { url: alternativeUrl, method: altMethod } = await getFileAccessUrl(alternativeMethod);
          
          if (alternativeUrl) {
            window.open(alternativeUrl, '_blank');
            setDownloadMethod(alternativeMethod);
            if (altMethod) {
              setLastSuccessMethod(altMethod);
            }
            
            toast({
              title: "Using alternative method",
              description: `Switched to ${getMethodName(alternativeMethod)} for viewing`,
            });
            return;
          }
        } catch (altError) {
          console.error(`Error with alternative method ${alternativeMethod}:`, altError);
        }
      }
      
      toast({
        title: "Access Error",
        description: "Could not access the file using any method. Please try again or contact support.",
        variant: "destructive"
      });
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
                variant={getBadgeVariant(downloadMethod)} 
                className="text-xs py-0 h-5"
              >
                {downloadMethod === 'secure' ? (
                  <Shield className="h-3 w-3 mr-1" />
                ) : downloadMethod === 'signed' ? (
                  <FileCheck className="h-3 w-3 mr-1" />
                ) : (
                  <Link className="h-3 w-3 mr-1" />
                )}
                {getMethodName(downloadMethod)}
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
                  variant={downloadMethod === 'secure' ? "default" : downloadMethod === 'signed' ? "secondary" : "destructive"}
                  size="sm" 
                  onClick={toggleDownloadMethod}
                  disabled={isLoading}
                  className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
                >
                  {downloadMethod === 'secure' ? (
                    <Shield className={`h-4 w-4 ${HOVER_TRANSITION}`} />
                  ) : downloadMethod === 'signed' ? (
                    <FileCheck className={`h-4 w-4 ${HOVER_TRANSITION}`} />
                  ) : (
                    <Link className={`h-4 w-4 ${HOVER_TRANSITION}`} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Using {getMethodName(downloadMethod)} - Click to change</p>
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
                    variant={downloadActive ? "default" : "outline"}
                    size="sm" 
                    onClick={downloadFile}
                    disabled={isLoading}
                    className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default} ${downloadActive ? 'bg-green-500 hover:bg-green-600' : ''}`}
                  >
                    <Download className={`h-4 w-4 ${isLoading || downloadActive ? 'animate-pulse' : ''} ${HOVER_TRANSITION}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download file using {getMethodName(downloadMethod)}</p>
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
          <div className="font-semibold mb-1">Access Information:</div>
          <div className="grid grid-cols-2 gap-1">
            <div><strong>Current Method:</strong></div>
            <div className="flex items-center">
              <Badge variant={getBadgeVariant(downloadMethod)} className="text-xs">
                {getMethodName(downloadMethod)}
              </Badge>
            </div>
            
            <div><strong>Last Successful:</strong></div>
            <div>{lastSuccessMethod ? (
              <Badge variant={getBadgeVariant(lastSuccessMethod)} className="text-xs">
                {getMethodName(lastSuccessMethod)}
              </Badge>
            ) : 'None'}</div>
            
            <div><strong>Path:</strong></div> 
            <div className="truncate">{attachment.path}</div>
            
            <div><strong>Delivery ID:</strong></div>
            <div className="truncate">{deliveryId || "(none)"}</div>
            
            <div><strong>Recipient:</strong></div>
            <div className="truncate">{recipientEmail || "(none)"}</div>
          </div>
          
          {accessUrl && (
            <div className="mt-2">
              <div className="font-semibold mb-1">Last Generated URL:</div>
              <div className="truncate bg-slate-100 p-1 rounded text-xs overflow-x-auto">
                {accessUrl}
              </div>
            </div>
          )}
          
          {directUrl && (
            <div className="mt-2">
              <div className="font-semibold mb-1">Direct URL:</div>
              <div className="truncate bg-slate-100 p-1 rounded text-xs overflow-x-auto">
                {directUrl}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
