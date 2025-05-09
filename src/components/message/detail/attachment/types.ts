
// Access methods and modes
export type AccessMethod = 'secure' | 'signed' | 'direct';
export type AccessMode = 'view' | 'download';
export type AccessMethodStatus = 'success' | 'error' | 'idle';

// Attachment properties
export interface AttachmentProps {
  name: string;
  size: number;
  type: string;
  path: string;
}

// Button properties
export interface AccessButtonProps {
  isLoading: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  tooltipText: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
  disabled?: boolean;
}
