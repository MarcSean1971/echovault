
import React from "react";
import { Shield, FileCheck, Link } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { AccessMethod } from "../types";
import { getMethodName } from "@/utils/fileUtils";
import { AccessButton } from "./AccessButton";

interface MethodToggleButtonProps { 
  downloadMethod: AccessMethod;
  isLoading: boolean;
  toggleDownloadMethod: () => void;
}

export const MethodToggleButton: React.FC<MethodToggleButtonProps> = ({ 
  downloadMethod, 
  isLoading, 
  toggleDownloadMethod 
}) => {
  return (
    <AccessButton
      variant={downloadMethod === 'secure' ? "default" : downloadMethod === 'signed' ? "secondary" : "destructive"}
      isLoading={isLoading}
      onClick={toggleDownloadMethod}
      icon={downloadMethod === 'secure' ? (
        <Shield className={`h-4 w-4 ${HOVER_TRANSITION}`} />
      ) : downloadMethod === 'signed' ? (
        <FileCheck className={`h-4 w-4 ${HOVER_TRANSITION}`} />
      ) : (
        <Link className={`h-4 w-4 ${HOVER_TRANSITION}`} />
      )}
      tooltipText={`Using ${getMethodName(downloadMethod)} - Click to change`}
    />
  );
};
