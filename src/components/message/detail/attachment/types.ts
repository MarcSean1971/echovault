
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
  variant?: string;
  className?: string;
}
