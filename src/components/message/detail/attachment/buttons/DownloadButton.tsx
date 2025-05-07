
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
      icon={<Download className={`h-4 w-4 text-blue-600 ${isLoading || downloadActive ? 'animate-pulse' : 'transform hover:scale-105'} ${HOVER_TRANSITION}`} />}
      tooltipText={`Download using ${getMethodName(downloadMethod)}`}
      className={downloadActive ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'hover:bg-blue-50 hover:border-blue-200'}
    />
  );
};
