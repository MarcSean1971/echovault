
import { useCallback } from "react";
import { AccessMethod } from "@/components/message/detail/attachment/types";
import { useDownloadHandlers } from "./useDownloadHandlers";
import { useAttachmentState } from "./useAttachmentState";
import { AttachmentAccessResult, AttachmentAccessProps } from "./types";

/**
 * Master hook for attachment access functionality
 */
export function useAttachmentAccess(
  props: AttachmentAccessProps
): AttachmentAccessResult {
  // Create state values and utilities using useAttachmentState
  const {
    isLoading,
    hasError,
    retryCount,
    showDebug,
    accessUrl,
    downloadMethod,
    lastSuccessMethod,
    downloadActive,
    attemptedMethods,
    currentMethodStatus,
    setIsLoading,
    setHasError,
    incrementRetryCount,
    setAccessUrl,
    setDownloadMethod,
    setLastSuccessMethod,
    setDownloadActive,
    updateMethodStatus,
    toggleDebug
  } = useAttachmentState();

  // Create utilities object for handlers
  const utilities = {
    setIsLoading,
    setHasError,
    incrementRetryCount,
    setAccessUrl,
    setDownloadMethod,
    setLastSuccessMethod,
    setDownloadActive,
    updateMethodStatus,
  };

  // Get download handlers
  const {
    directUrl,
    downloadFile: doDownload,
    openFile: doOpenFile,
    tryDirectAccess: doTryDirectAccess,
    retryAccess: doRetryAccess
  } = useDownloadHandlers(props, utilities);
  
  // Wrapper for download function
  const downloadFile = useCallback(async () => {
    setDownloadActive(true);
    return await doDownload(downloadMethod);
  }, [doDownload, downloadMethod, setDownloadActive]);
  
  // Wrapper for open function
  const openFile = useCallback(async () => {
    return await doOpenFile(downloadMethod);
  }, [doOpenFile, downloadMethod]);
  
  // Wrapper for direct access function (now handles Promise correctly)
  const tryDirectAccess = useCallback(async () => {
    setIsLoading(true);
    const result = await doTryDirectAccess();
    setIsLoading(false);
    return result;
  }, [doTryDirectAccess, setIsLoading]);
  
  // Wrapper for retry function
  const retryAccess = useCallback(async () => {
    return await doRetryAccess();
  }, [doRetryAccess]);
  
  // Toggle function to cycle through download methods
  const toggleDownloadMethod = useCallback(() => {
    const methods: AccessMethod[] = ['secure', 'signed', 'direct'];
    const currentIndex = methods.indexOf(downloadMethod);
    const nextIndex = (currentIndex + 1) % methods.length;
    setDownloadMethod(methods[nextIndex]);
  }, [downloadMethod, setDownloadMethod]);

  return {
    isLoading,
    hasError,
    retryCount,
    showDebug,
    accessUrl,
    downloadMethod,
    lastSuccessMethod,
    downloadActive,
    attemptedMethods,
    currentMethodStatus,
    directUrl,
    retryAccess,
    toggleDownloadMethod,
    downloadFile,
    openFile,
    tryDirectAccess,
    toggleDebug,
  };
}

// Re-export types
export * from "./types";
