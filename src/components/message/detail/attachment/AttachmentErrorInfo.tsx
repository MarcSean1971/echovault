
import React from "react";

interface AttachmentErrorInfoProps {
  hasError: boolean;
  retryCount: number;
}

export const AttachmentErrorInfo: React.FC<AttachmentErrorInfoProps> = ({ hasError, retryCount }) => {
  if (!hasError) {
    return null;
  }
  
  return (
    <div className="mt-2 text-xs text-red-600">
      There was an error accessing this file. Please try the direct URL option or contact the sender.
      {retryCount > 0 && (
        <span className="block mt-1">
          Retried {retryCount} time{retryCount !== 1 ? 's' : ''} without success.
        </span>
      )}
    </div>
  );
};
