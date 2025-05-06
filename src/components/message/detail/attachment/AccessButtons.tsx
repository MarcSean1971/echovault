
import React from "react";
import { Download, ExternalLink, RefreshCw, Link, Bug, Shield, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HOVER_TRANSITION, BUTTON_HOVER_EFFECTS } from "@/utils/hoverEffects";
import { AccessButtonProps, AccessMethod } from "./types";
import { getMethodName } from "@/utils/fileUtils";

export const AccessButton: React.FC<AccessButtonProps> = ({ 
  isLoading, 
  onClick, 
  icon, 
  tooltipText, 
  variant = "outline",
  className = ""
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant={variant} 
            size="sm" 
            onClick={onClick}
            disabled={isLoading}
            className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default} ${className}`}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const MethodToggleButton: React.FC<{ 
  downloadMethod: AccessMethod;
  isLoading: boolean;
  toggleDownloadMethod: () => void;
}> = ({ downloadMethod, isLoading, toggleDownloadMethod }) => {
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

export const DebugButton: React.FC<{ 
  isLoading: boolean; 
  toggleDebug: () => void;
}> = ({ isLoading, toggleDebug }) => {
  return (
    <AccessButton
      variant="ghost"
      isLoading={isLoading}
      onClick={toggleDebug}
      icon={<Bug className={`h-4 w-4 ${HOVER_TRANSITION}`} />}
      tooltipText="Toggle debug info"
    />
  );
};

export const DirectAccessButton: React.FC<{ 
  isLoading: boolean; 
  tryDirectAccess: () => void;
}> = ({ isLoading, tryDirectAccess }) => {
  return (
    <AccessButton
      variant="outline"
      isLoading={isLoading}
      onClick={tryDirectAccess}
      icon={<Link className={`h-4 w-4 ${HOVER_TRANSITION}`} />}
      tooltipText="Use direct URL"
      className="bg-amber-100 hover:bg-amber-200"
    />
  );
};

export const RetryButton: React.FC<{ 
  isLoading: boolean; 
  retryAccess: () => void;
}> = ({ isLoading, retryAccess }) => {
  return (
    <AccessButton
      variant="outline"
      isLoading={isLoading}
      onClick={retryAccess}
      icon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''} ${HOVER_TRANSITION}`} />}
      tooltipText="Retry access"
    />
  );
};

export const DownloadButton: React.FC<{ 
  isLoading: boolean; 
  downloadActive: boolean;
  downloadFile: () => void;
  downloadMethod: AccessMethod;
}> = ({ isLoading, downloadActive, downloadFile, downloadMethod }) => {
  return (
    <AccessButton
      variant={downloadActive ? "default" : "outline"}
      isLoading={isLoading}
      onClick={downloadFile}
      icon={<Download className={`h-4 w-4 ${isLoading || downloadActive ? 'animate-pulse' : ''} ${HOVER_TRANSITION}`} />}
      tooltipText={`Download file using ${getMethodName(downloadMethod)}`}
      className={downloadActive ? 'bg-green-500 hover:bg-green-600' : ''}
    />
  );
};

export const OpenButton: React.FC<{ 
  isLoading: boolean; 
  hasError: boolean;
  onClick: () => void;
}> = ({ isLoading, hasError, onClick }) => {
  return (
    <AccessButton
      variant="ghost"
      isLoading={isLoading}
      onClick={onClick}
      icon={hasError ? (
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''} ${HOVER_TRANSITION}`} />
      ) : (
        <ExternalLink className={`h-4 w-4 ${isLoading ? 'animate-pulse' : ''} ${HOVER_TRANSITION}`} />
      )}
      tooltipText={hasError ? 'Retry access' : 'Open in new tab'}
    />
  );
};
