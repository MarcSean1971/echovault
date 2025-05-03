
import React from "react";
import { AlertCircle } from "lucide-react";

export function CameraNotReadyWarning() {
  return (
    <div className="bg-amber-50 border border-amber-200 p-3 rounded-md flex items-start gap-2 w-full">
      <AlertCircle className="text-amber-500 w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="text-sm">
        <p className="font-medium text-amber-800">Camera initialization issue</p>
        <p className="text-amber-700">
          The camera stream is having trouble connecting. Please try the following:
        </p>
        <ul className="list-disc pl-5 mt-1 text-amber-700 space-y-1">
          <li>Ensure no other applications are using your camera</li>
          <li>Try refreshing the page</li>
          <li>Check your camera is properly connected</li>
          <li>Click the "Try Again" button below</li>
        </ul>
      </div>
    </div>
  );
}
