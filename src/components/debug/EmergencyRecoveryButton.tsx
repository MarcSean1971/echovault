
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { EmergencyRecoveryService } from "@/services/messages/monitoring/emergencyRecovery";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface EmergencyRecoveryButtonProps {
  messageId?: string;
}

export function EmergencyRecoveryButton({ messageId }: EmergencyRecoveryButtonProps) {
  const [isRunning, setIsRunning] = useState(false);
  
  const handleEmergencyFix = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    try {
      if (messageId) {
        await EmergencyRecoveryService.forceDeliverMessage(messageId);
      } else {
        await EmergencyRecoveryService.fixStuckNotifications();
      }
    } finally {
      setIsRunning(false);
    }
  };
  
  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleEmergencyFix}
      disabled={isRunning}
      className={`flex items-center gap-2 ${HOVER_TRANSITION}`}
    >
      {isRunning ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <AlertTriangle className="h-4 w-4" />
      )}
      {messageId ? "Force Deliver Now" : "Emergency Fix"}
    </Button>
  );
}
