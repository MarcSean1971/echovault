
import { useState } from "react";
import { AttachmentAccessState, AttachmentAccessUtilities } from "./types";
import { AccessMethod } from "@/components/message/detail/attachment/types";

/**
 * Hook for managing attachment access state
 */
export function useAttachmentState() {
  // Create initial state
  const [state, setState] = useState<AttachmentAccessState>({
    isLoading: false,
    hasError: false,
    retryCount: 0,
    showDebug: false,
    accessUrl: null,
    downloadMethod: 'secure',
    lastSuccessMethod: null,
    downloadActive: false,
    attemptedMethods: {},
    currentMethodStatus: 'idle'
  });

  // Utility functions to update state
  const setIsLoading = (isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  };

  const setHasError = (hasError: boolean) => {
    setState(prev => ({ ...prev, hasError }));
  };

  const incrementRetryCount = () => {
    setState(prev => ({ ...prev, retryCount: prev.retryCount + 1 }));
  };

  const setAccessUrl = (accessUrl: string | null) => {
    setState(prev => ({ ...prev, accessUrl }));
  };

  const setDownloadMethod = (downloadMethod: AccessMethod) => {
    setState(prev => ({ ...prev, downloadMethod }));
  };

  const setLastSuccessMethod = (lastSuccessMethod: AccessMethod | null) => {
    setState(prev => ({ ...prev, lastSuccessMethod }));
  };

  const setDownloadActive = (downloadActive: boolean) => {
    setState(prev => ({ ...prev, downloadActive }));
  };

  const updateMethodStatus = (method: AccessMethod, success: boolean) => {
    setState(prev => ({
      ...prev,
      attemptedMethods: {
        ...prev.attemptedMethods,
        [method]: true
      },
      currentMethodStatus: success ? 'success' : 'error',
      lastSuccessMethod: success ? method : prev.lastSuccessMethod
    }));
  };

  const toggleDebug = () => {
    setState(prev => ({ ...prev, showDebug: !prev.showDebug }));
  };

  // Return state values and utility functions
  return {
    // State values
    isLoading: state.isLoading,
    hasError: state.hasError,
    retryCount: state.retryCount,
    showDebug: state.showDebug,
    accessUrl: state.accessUrl,
    downloadMethod: state.downloadMethod,
    lastSuccessMethod: state.lastSuccessMethod,
    downloadActive: state.downloadActive,
    attemptedMethods: state.attemptedMethods,
    currentMethodStatus: state.currentMethodStatus,
    
    // Utility functions
    setIsLoading,
    setHasError,
    incrementRetryCount,
    setAccessUrl,
    setDownloadMethod,
    setLastSuccessMethod,
    setDownloadActive,
    updateMethodStatus,
    toggleDebug
  };
}
