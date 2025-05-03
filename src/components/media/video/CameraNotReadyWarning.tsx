
import React from "react";
import { AlertCircle } from "lucide-react";

export function CameraNotReadyWarning() {
  return (
    <div className="bg-amber-50 border border-amber-200 p-3 rounded-md flex items-start gap-2 w-full">
      <AlertCircle className="text-amber-500 w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="text-sm">
        <p className="font-medium text-amber-800">Camera not connected</p>
        <p className="text-amber-700">
          Please ensure your camera is connected and permissions are granted.
        </p>
      </div>
    </div>
  );
}
