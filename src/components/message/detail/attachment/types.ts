
/**
 * Types for attachment components
 */

export interface AttachmentProps {
  name: string;
  size: number;
  type: string;
  path: string;
}

export type AccessMethod = 'secure' | 'signed' | 'direct';
export type AccessMode = 'download' | 'view';

export interface AccessMethodData {
  url: string | null;
  method: AccessMethod | null;
}

export interface AccessButtonProps {
  isLoading: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  tooltipText: string;
  variant?: "default" | "secondary" | "destructive" | "outline" | "link" | "ghost";
  className?: string;
}

export interface AttachmentAccessHookResult {
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
  retryAccess: () => Promise<void>;
  toggleDownloadMethod: () => void;
  downloadFile: () => Promise<void>;
  openFile: () => Promise<void>;
  tryDirectAccess: () => void;
  toggleDebug: () => void;
}
