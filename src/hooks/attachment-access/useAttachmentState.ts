
import { useState } from "react";
import { AttachmentAccessState } from "./types";
import { AccessMethod } from "@/components/message/detail/attachment/types";

/**
 * Hook for managing attachment access state
 */
export function useAttachmentState() {
  const [state, setState] = useState<AttachmentAccessState>({
    isLoading: false,
    hasError: false,
    retryCount: 0,
    showDebug: false,
    accessUrl: null,
    downloadMethod: 'direct', // Changed default to 'direct' for better public access
    lastSuccessMethod: null,
    downloadActive: false,
    attemptedMethods: {
      secure: false,
      signed: false,
      direct: false
    },
    currentMethodStatus: 'idle'
  });

  const updateMethodStatus = (method: AccessMethod, success: boolean) => {
    setState(prev => {
      const newState = { 
        ...prev,
        attemptedMethods: { ...prev.attemptedMethods, [method]: true }
      };
      
      if (success) {
        newState.currentMethodStatus = 'success';
        newState.lastSuccessMethod = method;
        // Reset error state on success
        newState.hasError = false;
      } else if (method === prev.downloadMethod) {
        newState.currentMethodStatus = 'error';
      }
      
      return newState;
    });
  };

  // Fixed naming to setIsLoading to match the types
  const setIsLoading = (isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  };

  const setHasError = (hasError: boolean) => {
    setState(prev => ({ ...prev, hasError }));
  };

  const setDownloadActive = (downloadActive: boolean) => {
    setState(prev => ({ ...prev, downloadActive }));
  };

  const incrementRetryCount = () => {
    setState(prev => ({ ...prev, retryCount: prev.retryCount + 1 }));
  };

  const toggleDebug = () => {
    setState(prev => ({ ...prev, showDebug: !prev.showDebug }));
  };

  const setAccessUrl = (url: string | null) => {
    setState(prev => ({ ...prev, accessUrl: url }));
  };

  const setDownloadMethod = (method: AccessMethod) => {
    setState(prev => ({ 
      ...prev, 
      downloadMethod: method,
      currentMethodStatus: prev.lastSuccessMethod === method ? 'success' : 'idle'
    }));
  };

  const setLastSuccessMethod = (method: AccessMethod | null) => {
    setState(prev => ({ ...prev, lastSuccessMethod: method }));
  };

  return {
    // Return state properties directly instead of the whole state object
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
    
    // Return the state and setState for advanced usage
    state,
    setState,
    
    // Return the utility functions
    updateMethodStatus,
    setIsLoading,
    setHasError,
    setDownloadActive,
    incrementRetryCount,
    toggleDebug,
    setAccessUrl,
    setDownloadMethod,
    setLastSuccessMethod
  };
}
