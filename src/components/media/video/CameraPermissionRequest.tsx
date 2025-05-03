
import React from "react";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { HOVER_TRANSITION, BUTTON_HOVER_EFFECTS } from "@/utils/hoverEffects";

interface CameraPermissionRequestProps {
  onRequestAccess: () => void;
  onCancel: () => void;
}

export function CameraPermissionRequest({ onRequestAccess, onCancel }: CameraPermissionRequestProps) {
  return (
    <div className="p-4 bg-background rounded-lg border">
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <div className="bg-primary/10 p-4 rounded-full">
          <Camera className="h-12 w-12 text-primary" />
        </div>
        
        <div className="text-center space-y-2 max-w-md">
          <h3 className="font-medium text-lg">Camera Permission Required</h3>
          <p className="text-muted-foreground">
            To record a video message, we need permission to access your camera and microphone.
            Click the button below to grant access.
          </p>
          
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-md my-4 text-left">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> If you've previously denied camera access, you may need to 
              update your browser settings to allow access.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Button 
            onClick={onRequestAccess}
            className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default} flex items-center gap-2`}
          >
            <Camera className="h-4 w-4" /> Grant Camera Access
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onCancel}
            className={HOVER_TRANSITION}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
