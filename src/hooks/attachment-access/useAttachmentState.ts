
import { useState } from "react";
import { AccessMethod } from "@/components/message/detail/attachment/types";
import { AttachmentAccessState } from "./types";

/**
 * Hook for managing attachment access state
 */
export function useAttachmentState() {
  // Initial state for attachment access
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

  // State update functions
  const setLoading = (isLoading: boolean) => {
    setState(prev => ({
      ...prev,
      isLoading
    }));
  };

  const setHasError = (hasError: boolean) => {
    setState(prev => ({
      ...prev,
      hasError,
      currentMethodStatus: hasError ? 'error' : prev.currentMethodStatus
    }));
  };

  const setDownloadActive = (downloadActive: boolean) => {
    setState(prev => ({
      ...prev,
      downloadActive
    }));
  };

  const incrementRetryCount = () => {
    setState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1
    }));
  };

  const toggleDebug = () => {
    setState(prev => ({
      ...prev,
      showDebug: !prev.showDebug
    }));
  };

  const setAccessUrl = (url: string | null) => {
    setState(prev => ({
      ...prev,
      accessUrl: url
    }));
  };

  const setDownloadMethod = (method: AccessMethod) => {
    setState(prev => ({
      ...prev,
      downloadMethod: method
    }));
  };

  const updateMethodStatus = (method: AccessMethod, success: boolean) => {
    setState(prev => ({
      ...prev,
      attemptedMethods: {
        ...prev.attemptedMethods,
        [method]: success
      },
      lastSuccessMethod: success ? method : prev.lastSuccessMethod,
      currentMethodStatus: success ? 'success' : prev.hasError ? 'error' : 'idle'
    }));
  };

  // Convenience function to toggle between download methods
  const toggleDownloadMethod = () => {
    const nextMethod: { [key in AccessMethod]: AccessMethod } = {
      'secure': 'signed',
      'signed': 'direct',
      'direct': 'secure'
    };

    setState(prev => ({
      ...prev,
      downloadMethod: nextMethod[prev.downloadMethod]
    }));
  };

  return {
    state,
    setLoading,
    setHasError,
    setDownloadActive,
    incrementRetryCount,
    toggleDebug,
    setAccessUrl,
    setDownloadMethod,
    updateMethodStatus,
    toggleDownloadMethod
  };
}
