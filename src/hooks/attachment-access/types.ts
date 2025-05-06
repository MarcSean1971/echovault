
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

export interface AttachmentAccessResult extends AttachmentAccessState {
  directUrl: string | null;
  retryAccess: () => Promise<void>;
  toggleDownloadMethod: () => void;
  downloadFile: () => Promise<void>;
  openFile: () => Promise<void>;
  tryDirectAccess: () => void;
  toggleDebug: () => void;
}
