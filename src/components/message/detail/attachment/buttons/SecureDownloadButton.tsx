
import React from "react";
import { Shield, Download } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { AccessButton } from "./AccessButton";

interface SecureDownloadButtonProps { 
  isLoading: boolean; 
  onClick: () => void;
}

export const SecureDownloadButton: React.FC<SecureDownloadButtonProps> = ({ 
  isLoading, 
  onClick 
}) => {
  return (
    <AccessButton
      variant="default"
      isLoading={isLoading}
      onClick={onClick}
      icon={
        <div className="relative">
          <Shield className={`h-4 w-4 ${HOVER_TRANSITION}`} />
          <Download className="h-2 w-2 absolute -bottom-0.5 -right-0.5 text-white" />
        </div>
      }
      tooltipText="Force secure download (Edge Function)"
      className="bg-blue-600 hover:bg-blue-700 text-white"
    />
  );
};
