
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
          <Download className={`h-2 w-2 absolute -bottom-0.5 -right-0.5 text-white ${HOVER_TRANSITION}`} />
        </div>
      }
      tooltipText="Force secure download"
      className="bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg"
    />
  );
};
