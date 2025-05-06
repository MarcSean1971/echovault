
import React from "react";
import { AttachmentBadge } from "./AttachmentBadge";
import { AccessMethod } from "./types";
import { Check, X } from "lucide-react";

interface DebugInfoProps {
  downloadMethod: AccessMethod;
  lastSuccessMethod: AccessMethod | null;
  attachmentPath: string;
  deliveryId?: string;
  recipientEmail?: string;
  accessUrl?: string | null;
  directUrl?: string | null;
  retryCount?: number;
  hasError?: boolean;
  attemptedMethods?: {[key in AccessMethod]?: boolean};
}

export const DebugInfo: React.FC<DebugInfoProps> = ({
  downloadMethod,
  lastSuccessMethod,
  attachmentPath,
  deliveryId,
  recipientEmail,
  accessUrl,
  directUrl,
  retryCount,
  hasError = false,
  attemptedMethods = {}
}) => {
  return (
    <div className="mt-2 text-xs text-gray-500 border-t pt-2">
      <div className="font-semibold mb-1">Access Information:</div>
      <div className="grid grid-cols-2 gap-1">
        <div><strong>Current Method:</strong></div>
        <div className="flex items-center">
          <AttachmentBadge method={downloadMethod} />
        </div>
        
        <div><strong>Last Successful:</strong></div>
        <div>{lastSuccessMethod ? (
          <AttachmentBadge method={lastSuccessMethod} />
        ) : 'None'}</div>
        
        <div><strong>Path:</strong></div> 
        <div className="truncate">{attachmentPath}</div>
        
        <div><strong>Delivery ID:</strong></div>
        <div className="truncate">{deliveryId || "(none)"}</div>
        
        <div><strong>Recipient:</strong></div>
        <div className="truncate">{recipientEmail || "(none)"}</div>

        {hasError && retryCount !== undefined && retryCount > 0 && (
          <>
            <div><strong>Retry Attempts:</strong></div>
            <div>{retryCount}</div>
          </>
        )}
        
        <div><strong>Attempted Methods:</strong></div>
        <div className="flex items-center gap-2">
          {['secure', 'signed', 'direct'].map((method) => {
            const attempted = attemptedMethods?.[method as AccessMethod];
            const isSuccessful = lastSuccessMethod === method;
            return (
              <div key={method} className="flex items-center" title={`${method}: ${attempted ? isSuccessful ? 'Successful' : 'Failed' : 'Not attempted'}`}>
                <span className="mr-1">{method.substring(0,1).toUpperCase()}</span>
                {attempted !== undefined && (
                  isSuccessful ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <X className="h-3 w-3 text-red-500" />
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {accessUrl && (
        <div className="mt-2">
          <div className="font-semibold mb-1">Last Generated URL:</div>
          <div className="truncate bg-slate-100 p-1 rounded text-xs overflow-x-auto">
            {accessUrl}
          </div>
        </div>
      )}
      
      {directUrl && (
        <div className="mt-2">
          <div className="font-semibold mb-1">Direct URL:</div>
          <div className="truncate bg-slate-100 p-1 rounded text-xs overflow-x-auto">
            {directUrl}
          </div>
        </div>
      )}
    </div>
  );
};
