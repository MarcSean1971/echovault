
import { AccessMethod } from "@/components/message/detail/attachment/types";

export interface AttachmentAccessProps {
  filePath: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  deliveryId?: string;
  recipientEmail?: string;
}

export interface AttachmentAccessState {
  isLoading: boolean;
  hasError: boolean;
  retryCount: number;
  showDebug: boolean;
  accessUrl: string | null;
  downloadMethod: AccessMethod;
  lastSuccessMethod: AccessMethod | null;
  downloadActive: boolean;
  attemptedMethods: {[key in AccessMethod]?: boolean};
  currentMethodStatus: 'idle' | 'success' | 'error';
}

export interface AttachmentAccessUtilities {
  setIsLoading: (loading: boolean) => void;
  setHasError: (hasError: boolean) => void;
  incrementRetryCount: () => void;
  setAccessUrl: (url: string | null) => void;
  setDownloadMethod: (method: AccessMethod) => void;
  setLastSuccessMethod: (method: AccessMethod | null) => void;
  setDownloadActive: (active: boolean) => void;
  updateMethodStatus: (method: AccessMethod, success: boolean) => void;
}

export interface AttachmentAccessResult {
  isLoading: boolean;
  hasError: boolean;
  retryCount: number;
  showDebug: boolean;
  accessUrl: string | null;
  downloadMethod: AccessMethod;
  lastSuccessMethod: AccessMethod | null;
  downloadActive: boolean;
  attemptedMethods: {[key in AccessMethod]?: boolean};
  currentMethodStatus: 'idle' | 'success' | 'error';
  directUrl: string | null;
  retryAccess: () => Promise<boolean>;
  toggleDownloadMethod: () => void;
  downloadFile: () => Promise<boolean>;
  openFile: () => Promise<boolean>;
  tryDirectAccess: () => Promise<{ success: boolean; url: string | null; method: AccessMethod | null }>;
  toggleDebug: () => void;
}
