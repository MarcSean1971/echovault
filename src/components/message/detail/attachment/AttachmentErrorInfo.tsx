
import React from "react";
import { AlertCircle } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface AttachmentErrorInfoProps {
  hasError: boolean;
  retryCount: number;
  bucketError?: boolean;
}

export function AttachmentErrorInfo({ hasError, retryCount, bucketError = false }: AttachmentErrorInfoProps) {
  if (!hasError) return null;
  
  return (
    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
      <div className="flex items-center gap-2">
        <AlertCircle className={`h-4 w-4 text-red-500 flex-shrink-0 ${HOVER_TRANSITION}`} />
        <div className="text-sm text-red-700">
          <span className="font-medium">Error accessing file</span>
          {bucketError ? (
            <p className="text-xs mt-1">
              Storage bucket issue detected. Please click the debug button for more information and try using a different download method.
            </p>
          ) : (
            <p className="text-xs mt-1">
              Failed to access the file{retryCount > 0 ? ` after ${retryCount} attempts` : ''}. 
              Please try the "Force Secure Download" option (green shield icon) or check the debug information.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
