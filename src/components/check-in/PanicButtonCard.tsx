
import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCondition } from "@/types/message";
import { usePanicButtonLogic } from "@/hooks/usePanicButtonLogic";
import { EmergencyButton } from "./panic-button/EmergencyButton";
import { CreateMessageButton } from "./panic-button/CreateMessageButton";
import { StatusMessages } from "./panic-button/StatusMessages";

interface PanicButtonCardProps {
  userId: string | undefined;
  panicMessage: MessageCondition | null;
  isChecking: boolean;
  isLoading: boolean;
}

export function PanicButtonCard({ userId, panicMessage, isChecking, isLoading }: PanicButtonCardProps) {
  // Use the custom hook for panic button logic
  const {
    panicMode,
    isConfirming,
    triggerInProgress,
    countDown,
    hasPanicMessages,
    locationPermission,
    getKeepArmedValue,
    handlePanicButtonClick,
    handleCreatePanicMessage
  } = usePanicButtonLogic(userId, panicMessage, isChecking, isLoading);

  // Debug info
  useEffect(() => {
    if (panicMessage) {
      console.log("Panic message loaded:", panicMessage);
      if (panicMessage.panic_trigger_config) {
        console.log("Panic config (panic_trigger_config):", panicMessage.panic_trigger_config);
      }
      if (panicMessage.panic_config) {
        console.log("Panic config (panic_config):", panicMessage.panic_config);
      }
    }
  }, [panicMessage]);

  return (
    <Card className={panicMode ? "border-red-500" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center text-red-500">
          <AlertCircle className="h-5 w-5 mr-2" />
          Emergency Panic Button
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>
          Press this button in emergency situations to immediately trigger your 
          configured emergency messages with your current location.
        </p>
        
        {panicMessage ? (
          <EmergencyButton 
            isPanicMode={panicMode}
            isConfirming={isConfirming}
            countDown={countDown}
            onClick={handlePanicButtonClick}
            disabled={isChecking || panicMode || isLoading || triggerInProgress}
          />
        ) : (
          <CreateMessageButton 
            onClick={handleCreatePanicMessage}
            disabled={isLoading}
          />
        )}
        
        <StatusMessages
          isConfirming={isConfirming}
          locationPermission={locationPermission}
          hasPanicMessage={!!panicMessage}
          hasPanicMessages={hasPanicMessages}
          isLoading={isLoading}
          keepArmed={!!panicMessage && getKeepArmedValue()}
        />
      </CardContent>
    </Card>
  );
}
