
import React from "react";
import { Download } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { AccessMethod } from "../types";
import { getMethodName } from "@/utils/fileUtils";
import { AccessButton } from "./AccessButton";

interface DownloadButtonProps { 
  isLoading: boolean; 
  downloadActive: boolean;
  downloadFile: () => void;
  downloadMethod: AccessMethod;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({ 
  isLoading, 
  downloadActive, 
  downloadFile, 
  downloadMethod 
}) => {
  return (
    <AccessButton
      variant={downloadActive ? "default" : "outline"}
      isLoading={isLoading}
      onClick={downloadFile}
      icon={<Download className={`h-4 w-4 ${isLoading || downloadActive ? 'animate-pulse' : ''} ${HOVER_TRANSITION}`} />}
      tooltipText={`Download file using ${getMethodName(downloadMethod)}`}
      className={downloadActive ? 'bg-green-500 hover:bg-green-600' : 'hover:bg-blue-100'}
    />
  );
};
