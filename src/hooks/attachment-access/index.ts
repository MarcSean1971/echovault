
import { useEffect } from "react";
import { AttachmentAccessProps, AttachmentAccessResult, AttachmentAccessUtilities } from "./types";
import { useAttachmentState } from "./useAttachmentState";
import { useDownloadHandlers } from "./useDownloadHandlers";

/**
 * Main hook for attachment access functionality
 */
export function useAttachmentAccess(props: AttachmentAccessProps): AttachmentAccessResult {
  // Use the state management hook
  const {
    state,
    updateMethodStatus,
    setLoading,
    setHasError,
    setDownloadActive,
    incrementRetryCount,
    toggleDebug,
    setAccessUrl,
    setDownloadMethod,
    toggleDownloadMethod
  } = useAttachmentState();
  
  // Create utilities object to pass to handlers
  const utilities: AttachmentAccessUtilities = {
    updateMethodStatus,
    setLoading,
    setHasError,
    setDownloadActive,
    incrementRetryCount,
    setAccessUrl,
    setDownloadMethod
  };
  
  // Use the download handlers
  const {
    directUrl,
    downloadFile: executeDownload,
    openFile: executeOpenFile,
    tryDirectAccess,
    retryAccess: executeRetry
  } = useDownloadHandlers(props, utilities);
  
  // Update download active state after a short period
  useEffect(() => {
    if (state.downloadActive) {
      const timer = setTimeout(() => {
        setDownloadActive(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.downloadActive]);

  // Update method status when methods change
  useEffect(() => {
    const newStatus = state.lastSuccessMethod === state.downloadMethod 
      ? 'success' 
      : state.hasError 
        ? 'error' 
        : 'idle';
        
    if (newStatus !== state.currentMethodStatus) {
      setHasError(state.hasError);
    }
  }, [state.downloadMethod, state.lastSuccessMethod, state.hasError]);
  
  // Handler functions that use the internal handlers
  const downloadFile = async () => {
    if (state.isLoading) return;
    await executeDownload(state.downloadMethod);
  };
  
  const openFile = async () => {
    if (state.isLoading) return;
    await executeOpenFile(state.downloadMethod);
  };
  
  // Fix the return type to ensure it's Promise<void>
  const retryAccess = async (): Promise<void> => {
    await executeRetry();
    // Removed the return statement to ensure void return type
  };

  // Return combined state and handlers
  return {
    ...state,
    directUrl,
    retryAccess,
    toggleDownloadMethod,
    downloadFile,
    openFile,
    tryDirectAccess,
    toggleDebug
  };
}

// Re-export types
export * from "./types";
