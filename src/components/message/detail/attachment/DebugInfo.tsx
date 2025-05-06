
import React from "react";
import { AccessMethod } from "./types";

interface DebugInfoProps {
  downloadMethod: AccessMethod;
  lastSuccessMethod: AccessMethod | null;
  attachmentPath: string;
  deliveryId?: string;
  recipientEmail?: string;
  accessUrl: string | null;
  directUrl: string | null;
  retryCount: number;
  hasError: boolean;
  attemptedMethods: {[key in AccessMethod]?: boolean};
}

export function DebugInfo({
  downloadMethod,
  lastSuccessMethod,
  attachmentPath,
  deliveryId,
  recipientEmail,
  accessUrl,
  directUrl,
  retryCount,
  hasError,
  attemptedMethods
}: DebugInfoProps) {
  // Parse attachment path to check if it includes a bucket prefix
  const pathParts = attachmentPath.split('/');
  const knownBuckets = ['message-attachments', 'message_attachments'];
  const hasBucketPrefix = knownBuckets.includes(pathParts[0]);
  
  const bucketInfo = hasBucketPrefix 
    ? `Bucket: ${pathParts[0]}, Path: ${pathParts.slice(1).join('/')}`
    : `No bucket prefix found. Using default bucket. Full path: ${attachmentPath}`;
  
  return (
    <div className="mt-3 border rounded p-2 bg-slate-50 text-slate-700 text-xs overflow-auto max-h-60">
      <div className="font-medium mb-1">
        Debug Info {hasError && <span className="text-red-500">(Error State)</span>}
      </div>
      
      <div className="space-y-1">
        <div><strong>Current Method:</strong> {downloadMethod}</div>
        {lastSuccessMethod && <div><strong>Last Success:</strong> {lastSuccessMethod}</div>}
        
        <div className="mt-2"><strong>File Path Analysis:</strong></div>
        <div className="pl-2">{bucketInfo}</div>
        
        <div className="mt-2"><strong>Path & Access:</strong></div>
        <div className="pl-2 break-all whitespace-normal">Path: {attachmentPath}</div>
        
        {deliveryId && (
          <div className="pl-2">Delivery ID: {deliveryId.substring(0, 8)}...</div>
        )}
        
        {recipientEmail && (
          <div className="pl-2">Recipient: {recipientEmail.substring(0, 5)}...</div>
        )}
        
        {directUrl && (
          <div className="mt-2">
            <strong>Direct URL (preview):</strong> 
            <div className="pl-2 break-all whitespace-normal text-blue-600">{directUrl.substring(0, 50)}...</div>
          </div>
        )}
        
        {accessUrl && (
          <div className="mt-2">
            <strong>Access URL (preview):</strong> 
            <div className="pl-2 break-all whitespace-normal text-blue-600">{accessUrl.substring(0, 50)}...</div>
          </div>
        )}
        
        <div className="mt-2">
          <strong>Attempted Methods:</strong>
          <div className="pl-2 grid grid-cols-3 gap-1">
            <div>Secure: {attemptedMethods.secure ? '✅' : '❌'}</div>
            <div>Signed: {attemptedMethods.signed ? '✅' : '❌'}</div>
            <div>Direct: {attemptedMethods.direct ? '✅' : '❌'}</div>
          </div>
        </div>
        
        {retryCount > 0 && (
          <div><strong>Retry Count:</strong> {retryCount}</div>
        )}
      </div>
    </div>
  );
}
